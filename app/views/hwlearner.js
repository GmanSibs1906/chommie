// Homework, learner by learner (Gman, 2026-11-14): open a learner -> see each homework round as Marked / Not marked ->
// pick it -> take the photo. Writing and printing the sheets stays on "Write homework".
import { state, save, esc } from "../state.js";
import { listPhotos, kindOf } from "../db.js";
import { getTasks } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { scoreLearner } from "../../shared/marking.js";
import { isHomework } from "../../shared/hwmark.js";

function roundsOf(code, photos) {
  const sheets = Object.values(state.hwSheets || {}).filter((s) => s.code === code).sort((a, b) => b.round - a.round);
  return sheets.map((s) => {
    const t = getTasks().find((x) => isHomework(x) && x.round === s.round), m = t && (state.marks[t.id] || {})[code];
    const held = photos.some((p) => p.code === code && kindOf(p) === "homework" && p.status === "held");
    const waiting = photos.some((p) => p.code === code && kindOf(p) === "homework" && p.status === "queued");
    if (m && m.sheetId === s.id) { const sc = scoreLearner(m.items); return { s, tone: sc.pending ? "warn" : "ok", text: sc.pending ? `Marked ${sc.right}/${sc.total}, needs you` : `Marked ${sc.right}/${sc.total}` }; }
    if (held) return { s, tone: "warn", text: "Page held: check it" };
    if (waiting) return { s, tone: "info", text: "Photo taken, not marked yet" };
    return { s, tone: "na", text: "Not marked" };
  });
}

export async function render(root, ctx) {
  ensureLearners();
  const photos = await listPhotos();
  const L = state.learners.filter((l) => l.consent);
  const rows = L.map((l) => ({ l, r: roundsOf(l.code, photos) }));
  const withHw = rows.filter((x) => x.r.length), marked = rows.filter((x) => x.r[0] && /^Marked/.test(x.r[0].text)).length;
  root.innerHTML = `
    <h1 class="v-title">Homework.</h1>
    <p class="v-lede">${withHw.length ? `${withHw.length} of ${L.length} learners have their own homework. ${marked} marked.` : "No homework yet. Mark the class books first; Chommie then writes each learner's own sheet from what they got wrong."}</p>
    <div class="btn-row"><button class="btn btn--accent btn--big" id="write" type="button">${withHw.length ? "Write or print homework" : "Write homework"}</button></div>
    <ul class="hw-list" id="hw-list">${rows.map(({ l, r }) => `<li><button type="button" class="hw-row" data-code="${esc(l.code)}" ${r.length ? "" : "disabled"} style="${r.length ? "" : "opacity:.6;cursor:default"}">
      <span class="flow-who"><strong>${esc(l.name)}</strong><span class="mono muted">${esc(l.code)}${r.length ? ` · round ${r[0].s.round}, ${r[0].s.questions.length} questions` : " · no homework"}</span></span>
      <span class="st st--${r.length ? r[0].tone : "na"}">${r.length ? esc(r[0].text) : "—"}</span></button>
      ${r.length > 1 ? `<p class="muted mono" style="font-size:12px;margin:4px 16px 0">Earlier: ${r.slice(1).map((x) => `round ${x.s.round} ${esc(x.text.toLowerCase())}`).join(", ")}</p>` : ""}</li>`).join("")}</ul>`;
  root.querySelector("#write").onclick = () => ctx.go("hwwrite");
  root.querySelectorAll("[data-code]").forEach((b) => b.onclick = () => {
    if (b.disabled) return;
    // Straight into marking, homework mode, this learner picked.
    state.markKind = "homework"; state.markPick = b.dataset.code; save(); ctx.go("markflow");
  });
}
