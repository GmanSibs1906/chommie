import { state, save, log, toast, esc } from "../state.js";
import { listPhotos, deleteWhere, putPhoto, deletePhoto, kindOf } from "../db.js";
import { getTasks } from "../orchestrator.js";
import { cropAnswer } from "../crop.js";
import { finalCorrect, needsTeacher, scoreLearner } from "../../shared/marking.js";
import { sameValue } from "../../shared/fractions.js";
import { isHomework, questionsFor } from "../../shared/hwmark.js";

const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || "";
const word = (b) => (b ? "correct" : "wrong");
let selTask = null, qaOpen = false, qaWho = "";
const WHY = { disagree: "The two markers disagree", unclear: "Handwriting unclear", teacher: "Still wrong after two fixes" };

export async function render(root, ctx) {
  const photos = await listPhotos();
  const held = photos.filter((p) => kindOf(p) === "homework" && p.status === "held");
  const choices = getTasks().filter((t, i) => i === 0 || Object.keys(state.marks[t.id] || {}).length);
  const task = choices.find((t) => t.id === selTask) || choices[0], marks = state.marks[task.id] || {};
  const pend = [];
  for (const m of Object.values(marks)) for (const it of m.items) if (needsTeacher(it) || it.decision) pend.push({ code: m.code, it });
  const open = pend.filter((p) => !p.it.decision), decided = pend.filter((p) => p.it.decision);
  const agreed = Object.values(marks).reduce((s, m) => s + m.items.filter((i) => i.status === "agree" && !i.decision).length, 0);
  const total = Object.values(marks).reduce((s, m) => s + m.items.length, 0);
  root.innerHTML = `
    <h1 class="v-title">The Reviewer re-checks every mark.</h1>
    <p class="v-lede">Where the two markers disagree, or the handwriting is unclear, the decision is yours. Nothing is released until you confirm.</p>
    ${choices.length > 1 ? `<div class="panel-box"><div class="field-inline"><label for="task-pick">Marks for</label><select id="task-pick" style="font:inherit;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">${choices.map((t) => `<option value="${t.id}" ${t.id === task.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div></div>` : ""}
    ${held.length ? heldHtml(held) : ""}
    ${!Object.keys(marks).length ? `<p class="notice">No marks yet. Snap and mark some books first.</p><div class="btn-row"><button class="btn btn--accent" id="to-snap" type="button">Snap books</button></div>` : `
    <div class="panel-box"><p id="check-sum"><strong>${open.length}</strong> need${open.length === 1 ? "s" : ""} you. ${agreed} of ${total} answers: both markers agree and the Reviewer's check passed. ${decided.length} decided by you.</p></div>
    <div id="queue">${open.map((p, i) => card(p, i, task)).join("") || '<p class="notice" id="all-clear">Nothing is waiting for you.</p>'}</div>
    ${decided.length ? `<details class="panel-box"><summary style="cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center">Decided by you (${decided.length})</summary>${decided.map((p, i) => card(p, "d" + i, task)).join("")}</details>` : ""}
    ${qaHtml(task, marks)}
    <div class="panel-box"><h3>Confirm marks</h3>
      ${state.marksConfirmed[task.id] ? '<p class="st st--ok" id="confirmed">Confirmed. Photos deleted from this phone.</p><div class="btn-row"><button class="btn btn--accent" id="to-heat" type="button">See the heat map</button></div>'
        : `<p class="muted">Confirming approves these marks and deletes the book photos from this phone.</p><div class="btn-row"><button class="btn btn--accent" id="confirm" type="button" ${open.length ? "disabled" : ""}>Confirm marks and delete photos</button></div>${open.length ? `<p class="muted" style="font-size:14px">${open.length} item(s) still need you.</p>` : ""}`}</div>`}`;
  const $ = (s) => root.querySelector(s);
  const tp = $("#task-pick"); if (tp) tp.onchange = () => { selTask = tp.value; render(root, ctx); };
  root.querySelectorAll("[data-refile]").forEach((b) => b.onclick = async () => {
    const p = held.find((x) => x.id === b.dataset.refile), to = root.querySelector(`[data-refile-to="${p.id}"]`).value;
    const n = photos.filter((x) => x.code === to && kindOf(x) === "homework").length + 1;
    await putPhoto({ ...p, code: to, page: n, status: "queued", holdReason: null, claimed: null });
    log("Teacher", `Moved a held homework page to ${to}`, `Was picked as ${p.code}. It will be checked against the sheet again when you mark.`); toast("Moved to " + to + ". Mark it again."); render(root, ctx);
  });
  root.querySelectorAll("[data-drop]").forEach((b) => b.onclick = async () => { await deletePhoto(b.dataset.drop); log("Teacher", "Deleted a held homework page", ""); render(root, ctx); });
  const qa = $("#qa-review"); if (qa) qa.ontoggle = () => { qaOpen = qa.open; };
  const qw = $("#qa-who"); if (qw) qw.onchange = () => { qaWho = qw.value; qaOpen = true; render(root, ctx); };
  const ts = $("#to-snap"); if (ts) ts.onclick = () => ctx.go("snap");
  const th = $("#to-heat"); if (th) th.onclick = () => ctx.go("heat");
  root.querySelectorAll("[data-decide]").forEach((b) => b.onclick = () => {
    const [code, n, val] = b.dataset.decide.split("|"); const it = marks[code].items.find((i) => i.n === +n);
    it.decision = { correct: val === "1", by: "teacher", at: new Date().toISOString() };
    log("Teacher", `Decided Q${n} of ${code}`, `Marked ${val === "1" ? "correct" : "wrong"} (${WHY[it.status] || "review"})`); save(); toast("Decision saved"); render(root, ctx);
  });
  root.querySelectorAll("[data-undo]").forEach((b) => b.onclick = () => { const [code, n] = b.dataset.undo.split("|"); delete marks[code].items.find((i) => i.n === +n).decision; save(); render(root, ctx); });
  const cf = $("#confirm"); if (cf) cf.onclick = async () => {
    const done = new Set(Object.keys(marks)), hw = isHomework(task);
    await deleteWhere((p) => done.has(p.code) && (hw ? kindOf(p) === "homework" && p.status !== "held" : kindOf(p) === "class"));
    state.marksConfirmed[task.id] = true; log("Teacher", "Confirmed marks", `${Object.keys(marks).length} books. Photos deleted from this phone.`); save(); toast("Marks confirmed, photos deleted"); render(root, ctx);
  };
  // crops (async, after paint)
  for (const p of [...open, ...decided]) {
    const holder = root.querySelector(`[data-crop="${p.code}|${p.it.n}"]`); if (!holder) continue;
    const pg = photos.filter((x) => x.code === p.code && kindOf(x) === (isHomework(task) ? "homework" : "class") && x.status !== "held").sort((a, b) => a.page - b.page);
    const src = p.it.A?.box ? p.it.A : p.it.B; const photo = pg[(Number(src?.page) || 1) - 1] || pg[0];
    if (photo) { const c = await cropAnswer(photo.blob, src?.box); holder.innerHTML = `<img class="thumb" alt="${c.cropped ? "Cropped answer" : "Full page"} for ${p.code} question ${p.it.n}" src="${c.url}" style="max-height:200px" /><p class="muted" style="font-size:12px">${c.cropped ? "Cropped to the answer." : "Whole page (answer location not given)."}</p>`; }
    else holder.innerHTML = '<p class="muted" style="font-size:13px">Photo already deleted after confirmation.</p>';
  }
}

function card({ code, it }, key, task) {
  const q = questionsFor(task, code).find((x) => x.n === it.n);
  const row = (label, r) => r ? `<tr><td>${label}</td><td class="mono">${esc(r.read || "none")}</td><td>${(r.legible === false || r.confidence < 0.8) ? '<span class="st st--warn">unclear</span>' : `<span class="st ${r.correct ? "st--ok" : "st--bad"}">${word(r.correct)}</span>`}</td><td class="muted" style="font-size:13px">${esc(r.evidence || "")}</td></tr>` : "";
  const rv = it.reviewer, rvMatch = rv && rv.legible !== false ? sameValue(rv.read, q.answer) : null;
  const decided = it.decision;
  return `<article class="panel-box" data-item="${code}|${it.n}" style="${decided ? "opacity:.85" : ""}">
    <p class="st st--${decided ? "ok" : it.status === "unclear" ? "warn" : "bad"}">${decided ? "You decided: " + word(it.decision.correct) : WHY[it.status] || "Needs you"}</p>
    <h3>${code} ${esc(nameOf(code))}, question ${it.n}: <span class="mono">${esc(q.q)}</span></h3>
    <p class="muted">Memo answer: <strong class="mono">${esc(q.answer)}</strong></p>
    ${rv && it.A && it.B && rv.legible !== false && (rv.correct !== it.A.correct || rv.correct !== it.B.correct) ? `<p class="notice" data-caught="1">The Reviewer caught a wrong mark: Marker ${rv.correct !== it.A.correct ? "A" : "B"} said ${word(rv.correct !== it.A.correct ? it.A.correct : it.B.correct)}, the Reviewer read "${esc(rv.read)}" and says ${word(rv.correct)}.</p>` : ""}
    <div class="grid2"><div data-crop="${code}|${it.n}"></div>
    <div><table class="tbl"><thead><tr><th></th><th>Read</th><th>Mark</th><th>Evidence</th></tr></thead><tbody>
      ${row("Marker A (Anthropic)", it.A)}${row("Marker B (Google)", it.B)}
      ${rv ? `<tr><td>Reviewer (OpenAI)</td><td class="mono">${esc(rv.read)}</td><td><span class="st ${rv.legible === false ? "st--warn" : rv.correct ? "st--ok" : "st--bad"}">${rv.legible === false ? "unclear" : word(rv.correct)}</span></td><td class="muted" style="font-size:13px">${esc(rv.reason || "")}</td></tr>` : ""}
    </tbody></table>
    ${rv && rvMatch !== null ? `<p class="muted" style="font-size:14px">Code check: the Reviewer's reading ${rvMatch ? "equals" : "does not equal"} the memo answer.</p>` : ""}
    ${it.reason ? `<p class="muted" style="font-size:14px">${esc(it.reason)}. Sent back ${it.attempts} time(s).</p>` : ""}</div></div>
    <div class="btn-row">
      <button class="btn btn--accent" data-decide="${code}|${it.n}|1" type="button">Mark correct</button>
      <button class="btn btn--danger" data-decide="${code}|${it.n}|0" type="button">Mark wrong</button>
      ${decided ? `<button class="btn btn--ghost" data-undo="${code}|${it.n}" type="button">Undo</button>` : ""}
    </div></article>`;
}

function heldHtml(held) {
  const L = (state.learners || []).filter((l) => l.consent);
  return `<div class="panel-box" id="held"><h3>Homework pages held for you (${held.length})</h3>
    <p class="muted">These pages were not marked. The learner you picked, the code and QR on the page, or the approved sheets did not agree.</p>
    ${held.map((p) => `<article class="panel-box hold-card" data-held-page="${p.id}"><p class="st st--warn">Not marked</p>
      <div class="grid2"><div><img class="thumb" alt="Held homework page picked as ${p.code}" src="${URL.createObjectURL(p.blob)}" style="max-height:200px" /></div>
      <div><p><strong class="mono">${p.code}</strong> ${esc(nameOf(p.code))}, page ${p.page}</p><p>${esc(p.holdReason || "")}</p>
      <div class="field"><label for="to-${p.id}">Move this page to</label><select id="to-${p.id}" data-refile-to="${p.id}" style="font:inherit;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);width:100%">${L.map((l) => `<option value="${l.code}" ${l.code === (p.claimed || p.code) ? "selected" : ""}>${l.code} ${esc(l.name)}</option>`).join("")}</select></div>
      <div class="btn-row"><button class="btn btn--accent" data-refile="${p.id}" type="button">Move and mark again</button><button class="btn btn--danger" data-drop="${p.id}" type="button">Delete this page</button></div></div></div></article>`).join("")}</div>`;
}

// "Review before you approve" (Gman, 2026-11-14): the task's real questions and memo answers, and for one learner
// what was read on their page and the mark that counts, so the teacher can confirm before approving.
function qaHtml(task, marks) {
  const hw = isHomework(task), codes = Object.keys(marks).sort();
  if (!codes.length) return "";
  if (!codes.includes(qaWho) && !(qaWho === "" && !hw)) qaWho = hw ? codes[0] : "";
  const who = qaWho, qs = questionsFor(task, who || codes[0]), items = who ? marks[who]?.items || [] : [];
  const byN = Object.fromEntries(items.map((i) => [i.n, i]));
  const readOf = (it) => { if (!it) return "";
    if (it.decision && it.reviewer?.read) return it.reviewer.read;
    const a = it.A?.read ?? "", b = it.B?.read ?? "";
    return a === b || !b ? a : !a ? b : `A: ${a} · B: ${b}`; };
  const markOf = (it) => { const f = it ? finalCorrect(it) : null;
    return f === null ? '<span class="st st--warn">Needs you</span>' : `<span class="st ${f ? "st--ok" : "st--bad"}">${f ? "Correct" : "Wrong"}</span>${it.decision ? ' <span class="muted" style="font-size:12px">by you</span>' : ""}`; };
  const sc = who ? scoreLearner(items) : null;
  const opts = (hw ? "" : `<option value="" ${who === "" ? "selected" : ""}>Memo only (same for every learner)</option>`) +
    codes.map((c) => `<option value="${esc(c)}" ${c === who ? "selected" : ""}>${esc(c)} ${esc(nameOf(c))}</option>`).join("");
  return `<details class="panel-box qa-review" id="qa-review" ${qaOpen ? "open" : ""}>
    <summary>Check the questions and answers <span class="muted" style="font-weight:400">(optional, before you confirm)</span></summary>
    <p class="muted" style="margin-top:8px">${hw ? "Homework is personal: each learner has their own sheet. Pick a learner to see their questions, the memo, and what Chommie read." : "Every learner had the same questions. Pick a learner to also see what Chommie read on their page."}</p>
    <div class="field-inline"><label for="qa-who">Show</label><select id="qa-who" class="qa-select">${opts}</select></div>
    ${sc ? `<p id="qa-score"><strong>${sc.right} of ${sc.total}</strong> correct${sc.pending ? `, ${sc.pending} still need${sc.pending === 1 ? "s" : ""} you` : ""}.</p>` : ""}
    <div class="qa-scroll"><table class="tbl qa-tbl" id="qa-tbl"><thead><tr><th>#</th><th>Question</th><th>Memo answer</th>${who ? "<th>Learner wrote</th><th>Mark</th>" : ""}</tr></thead><tbody>
      ${qs.map((q) => `<tr data-qn="${q.n}"><td>${q.n}</td><td class="mono">${esc(q.q)}</td><td class="mono"><strong>${esc(q.answer)}</strong></td>${who ? `<td class="mono">${esc(readOf(byN[q.n]) || "none")}</td><td>${markOf(byN[q.n])}</td>` : ""}</tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="font-size:13px">Memo answers are worked out by calculation, not by AI.</p>
  </details>`;
}
