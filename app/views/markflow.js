// Phone-first marking (Gman, 2026-11-14): open the class -> Mark -> pick a learner -> take the photo -> the next learner
// is picked for you. One big button marks everything. The same flow handles personal homework, learner by learner.
import { state, save, log, toast, esc } from "../state.js";
import { listPhotos, kindOf, deletePhoto } from "../db.js";
import { getTasks, markAll, markHomeworkAll } from "../orchestrator.js";
import { maskAndStore, ensureLearners } from "./snap.js";
import { scoreLearner } from "../../shared/marking.js";
import { isHomework } from "../../shared/hwmark.js";
import { busy, idle } from "../agents.js";

let sel = null, running = false, progress = {};
const first = (name) => String(name || "").split(" ")[0] || name;

export async function render(root, ctx) {
  ensureLearners();
  state.markKind ||= "class";
  await draw(root, ctx);
}
export function leave() { idle(); }

// What each learner's row says: done, photo taken, needs you, or still to do.
function statusOf(code, photos, kind) {
  if (kind === "class") {
    const task = getTasks()[0], m = (state.marks[task.id] || {})[code];
    if (m) { const s = scoreLearner(m.items); return s.pending ? { tone: "warn", text: `${s.right}/${s.total}, ${s.pending} need${s.pending > 1 ? "" : "s"} you`, done: true } : { tone: "ok", text: `Marked ${s.right}/${s.total}`, done: true }; }
  } else {
    const rows = getTasks().filter(isHomework).map((t) => (state.marks[t.id] || {})[code]).filter(Boolean);
    const held = photos.filter((p) => p.code === code && kindOf(p) === "homework" && p.status === "held");
    if (held.length) return { tone: "warn", text: "Page held: check it", done: true };
    if (rows.length) { const s = scoreLearner(rows[rows.length - 1].items); return { tone: s.pending ? "warn" : "ok", text: s.pending ? `${s.right}/${s.total}, needs you` : `Marked ${s.right}/${s.total}`, done: true }; }
  }
  const n = photos.filter((p) => p.code === code && kindOf(p) === kind && p.status === "queued").length;
  if (n) return { tone: "info", text: `${n} photo${n > 1 ? "s" : ""} taken`, photo: true };
  return { tone: "na", text: "To do" };
}
// Class task: a status line that also notices a retake taken after the last mark.
function classStatus(code, photos) {
  const task = getTasks()[0], m = (state.marks[task.id] || {})[code];
  const newer = photos.some((p) => p.code === code && kindOf(p) === "class" && p.status === "queued" && (p.at || 0) > (m ? Date.parse(m.at) || 0 : 0));
  if (m && newer) return { tone: "info", text: "Retake waiting", photo: true };
  return null;
}

// A learner's homework rounds: which sheets exist and whether each was marked.
function roundsOf(code) {
  const sheets = Object.values(state.hwSheets || {}).filter((s) => s.code === code).sort((a, b) => a.round - b.round);
  return sheets.map((s) => {
    const t = getTasks().find((x) => isHomework(x) && x.round === s.round), m = t && (state.marks[t.id] || {})[code];
    const sc = m ? scoreLearner(m.items) : null;
    return { round: s.round, id: s.id, n: s.questions.length, marked: !!m && m.sheetId === s.id, score: sc };
  });
}

async function draw(root, ctx) {
  const kind = state.markKind === "homework" ? "homework" : "class";
  const photos = await listPhotos();
  const L = state.learners.filter((l) => l.consent);
  const rows = L.map((l) => ({ l, s: (kind === "class" && classStatus(l.code, photos)) || statusOf(l.code, photos, kind) }));
  if (state.markPick) { sel = state.markPick; delete state.markPick; save(); } // came from a learner on the Homework screen
  if (!sel || !L.some((l) => l.code === sel)) sel = (rows.find((r) => r.s.tone === "na") || rows[0] || {}).l?.code || null;
  const cur = L.find((l) => l.code === sel);
  const markedAt = (code) => { const t = getTasks()[0], m = kind === "class" ? (state.marks[t.id] || {})[code] : null; return m ? Date.parse(m.at) || 0 : 0; };
  // Waiting = a photo newer than this learner's last mark, so a marked book is not offered again (a retake is).
  const queued = [...new Set(photos.filter((p) => kindOf(p) === kind && p.status === "queued" && (p.at || 0) > markedAt(p.code)).map((p) => p.code))];
  const doneN = rows.filter((r) => r.s.done).length, photoN = rows.filter((r) => r.s.photo).length;
  const hw = kind === "homework", rounds = cur && hw ? roundsOf(cur.code) : [];
  const noSheet = hw && cur && !rounds.length;

  root.innerHTML = `
    <h1 class="v-title">${hw ? "Mark homework." : "Mark books."}</h1>
    <div class="seg" role="radiogroup" aria-label="What are you marking?">
      <button type="button" role="radio" aria-checked="${!hw}" class="seg-btn ${hw ? "" : "is-on"}" data-kind="class">Class task</button>
      <button type="button" role="radio" aria-checked="${hw}" class="seg-btn ${hw ? "is-on" : ""}" data-kind="homework">Homework</button>
    </div>
    <p class="mono flow-count" id="flow-count">${doneN} marked · ${photoN} photographed · ${L.length - doneN - photoN} to do</p>
    ${cur ? `<section class="snap-card" id="snap-card" aria-live="polite">
      <p class="mono snap-kicker">${hw ? "Homework of" : "Book of"}</p>
      <h2 class="snap-name" id="snap-name">${esc(cur.name)}</h2>
      <p class="mono muted" style="margin:0 0 12px">${esc(cur.code)}</p>
      ${hw ? (noSheet
        ? `<p class="notice">${esc(first(cur.name))} has no approved homework sheet yet. Write and approve homework first.</p><div class="btn-row"><button class="btn btn--accent btn--big" id="to-write" type="button">Write homework</button></div>`
        : `<ul class="round-list" id="round-list">${rounds.map((r) => `<li><span>Round ${r.round} · ${r.n} questions</span><span class="st ${r.marked ? (r.score.pending ? "st--warn" : "st--ok") : "st--na"}">${r.marked ? `Marked ${r.score.right}/${r.score.total}` : "Not marked"}</span></li>`).join("")}</ul>
           <p class="muted" style="font-size:14px">Photograph the sheet. Chommie reads the code on it and marks it against ${esc(first(cur.name))}'s own answers.</p>`) : ""}
      ${noSheet ? "" : `<p class="muted" style="font-size:14px;margin:0 0 10px">Keep the learner's name at the very top edge: that strip is blacked out on this phone before anything is sent.</p>
      <label class="btn btn--accent btn--big btn--block" for="cam-file" style="cursor:pointer" id="take">Take photo</label>
      <input type="file" id="cam-file" accept="image/*" capture="environment" class="sr-only" />
      <label class="btn btn--ghost btn--block" for="pick-file" style="cursor:pointer;margin-top:10px">Choose from gallery</label>
      <input type="file" id="pick-file" accept="image/*" class="sr-only" />`}
    </section>` : '<p class="notice">No learners with consent yet. Add learners first.</p><div class="btn-row"><button class="btn btn--accent btn--big" id="to-learners" type="button">Add learners</button></div>'}
    <h3 class="list-head">Learners</h3>
    <ul class="flow-list" id="flow-list">${rows.map(({ l, s }) => `<li><button type="button" class="flow-row ${l.code === sel ? "is-sel" : ""}" data-code="${esc(l.code)}">
      <span class="flow-who"><strong>${esc(l.name)}</strong><span class="mono muted">${esc(l.code)}</span></span>
      <span class="st st--${s.tone}">${esc(s.text)}</span></button></li>`).join("")}</ul>
    <div class="flow-bar" id="flow-bar">
      <button class="btn btn--accent btn--big btn--block" id="run" type="button" ${running || !queued.length ? "disabled" : ""}>${running ? "Marking…" : queued.length ? `Mark ${queued.length} ${hw ? "homework sheet" : "book"}${queued.length > 1 ? "s" : ""}` : "Take photos, then mark"}</button>
      ${doneN ? '<button class="btn btn--ghost btn--block" id="to-check" type="button" style="margin-top:8px">See results and anything that needs you</button>' : ""}
    </div>`;

  const $ = (s) => root.querySelector(s);
  root.querySelectorAll("[data-kind]").forEach((b) => b.onclick = () => { if (running) return; state.markKind = b.dataset.kind; save(); sel = null; draw(root, ctx); });
  root.querySelectorAll("[data-code]").forEach((b) => b.onclick = () => { sel = b.dataset.code; draw(root, ctx).then(() => root.querySelector("#snap-card")?.scrollIntoView({ behavior: "smooth", block: "start" })); });
  $("#to-learners")?.addEventListener("click", () => ctx.go("learners"));
  $("#to-write")?.addEventListener("click", () => ctx.go("hwwrite"));
  $("#to-check")?.addEventListener("click", () => ctx.go("check"));
  const onPhoto = async (e) => {
    const f = e.target.files[0]; if (!f || !cur) return;
    try {
      // A retake replaces the waiting page instead of adding a second one.
      for (const p of photos.filter((p) => p.code === cur.code && kindOf(p) === kind && p.status === "queued")) await deletePhoto(p.id);
      await maskAndStore(f, cur.code, "queued", { kind });
      toast(`Saved ${first(cur.name)}'s ${hw ? "sheet" : "book"} (name covered)`);
      const after = await listPhotos();
      const next = L.find((l) => l.code !== cur.code && statusOf(l.code, after, kind).tone === "na");
      if (next) sel = next.code;
      await draw(root, ctx);
    } catch (err) { toast("Could not save the photo: " + err.message); }
  };
  $("#cam-file")?.addEventListener("change", onPhoto);
  $("#pick-file")?.addEventListener("change", onPhoto);
  const run = $("#run");
  if (run) run.onclick = async () => {
    running = true; progress = {}; await draw(root, ctx);
    const say = (c, m) => {
      const who = first(state.learners.find((l) => l.code === c)?.name || c);
      const line = /Markers A and B/.test(m) ? `Marker A (Anthropic) and Marker B (Google) are marking ${who}'s ${hw ? "sheet" : "book"}`
        : /Reviewer/.test(m) ? `Reviewer (OpenAI): ${m.replace(/^Reviewer\s*/, "")} for ${who}`
        : /printed code/.test(m) ? `Marker A is reading the code on ${who}'s sheet` : null;
      if (line) busy(line);
      if (m === "done" || /^error|^held/.test(m)) { if (/^error/.test(m)) toast(`${who}: ${m.replace(/^error:\s*/, "")}`); if (root.isConnected) draw(root, ctx); }
    };
    try {
      if (hw) await markHomeworkAll(queued, (c, m) => { progress[c] = m; say(c, m); });
      else await markAll(getTasks()[0], queued, (c, m) => { progress[c] = m; say(c, m); });
      const errs = Object.entries(progress).filter(([, m]) => /^error/.test(m));
      idle(errs.length ? `${errs.length} could not be marked. Try again.` : "Done. Anything unclear waits for you in Check.");
      log("Coordinator", hw ? "Marked homework" : "Marked books", `${queued.length} learner(s)`);
    } finally { running = false; if (root.isConnected) await draw(root, ctx); }
    toast("Marking finished");
  };
}
