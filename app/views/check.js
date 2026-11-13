import { state, save, log, toast, esc } from "../state.js";
import { listPhotos, deleteByCode } from "../db.js";
import { getTasks } from "../orchestrator.js";
import { cropAnswer } from "../crop.js";
import { finalCorrect, needsTeacher, scoreLearner } from "../../shared/marking.js";
import { sameValue } from "../../shared/fractions.js";

const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || "";
const word = (b) => (b ? "correct" : "wrong");
const WHY = { disagree: "The two markers disagree", unclear: "Handwriting unclear", teacher: "Still wrong after two fixes" };

export async function render(root, ctx) {
  const task = getTasks()[0], marks = state.marks[task.id] || {};
  const photos = await listPhotos();
  const pend = [];
  for (const m of Object.values(marks)) for (const it of m.items) if (needsTeacher(it) || it.decision) pend.push({ code: m.code, it });
  const open = pend.filter((p) => !p.it.decision), decided = pend.filter((p) => p.it.decision);
  const agreed = Object.values(marks).reduce((s, m) => s + m.items.filter((i) => i.status === "agree" && !i.decision).length, 0);
  const total = Object.values(marks).reduce((s, m) => s + m.items.length, 0);
  root.innerHTML = `
    <h1 class="v-title">The Reviewer re-checks every mark.</h1>
    <p class="v-lede">Where the two markers disagree, or the handwriting is unclear, the decision is yours. Nothing is released until you confirm.</p>
    ${!Object.keys(marks).length ? `<p class="notice">No marks yet. Snap and mark some books first.</p><div class="btn-row"><button class="btn btn--accent" id="to-snap" type="button">Snap books</button></div>` : `
    <div class="panel-box"><p id="check-sum"><strong>${open.length}</strong> need${open.length === 1 ? "s" : ""} you. ${agreed} of ${total} answers: both markers agree and the Reviewer's check passed. ${decided.length} decided by you.</p></div>
    <div id="queue">${open.map((p, i) => card(p, i)).join("") || '<p class="notice" id="all-clear">Nothing is waiting for you.</p>'}</div>
    ${decided.length ? `<details class="panel-box"><summary style="cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center">Decided by you (${decided.length})</summary>${decided.map((p, i) => card(p, "d" + i)).join("")}</details>` : ""}
    <div class="panel-box"><h3>Confirm marks</h3>
      ${state.marksConfirmed[task.id] ? '<p class="st st--ok" id="confirmed">Confirmed. Photos deleted from this phone.</p><div class="btn-row"><button class="btn btn--accent" id="to-heat" type="button">See the heat map</button></div>'
        : `<p class="muted">Confirming approves these marks and deletes the book photos from this phone.</p><div class="btn-row"><button class="btn btn--accent" id="confirm" type="button" ${open.length ? "disabled" : ""}>Confirm marks and delete photos</button></div>${open.length ? `<p class="muted" style="font-size:14px">${open.length} item(s) still need you.</p>` : ""}`}</div>`}`;
  const $ = (s) => root.querySelector(s);
  const ts = $("#to-snap"); if (ts) ts.onclick = () => ctx.go("snap");
  const th = $("#to-heat"); if (th) th.onclick = () => ctx.go("heat");
  root.querySelectorAll("[data-decide]").forEach((b) => b.onclick = () => {
    const [code, n, val] = b.dataset.decide.split("|"); const it = marks[code].items.find((i) => i.n === +n);
    it.decision = { correct: val === "1", by: "teacher", at: new Date().toISOString() };
    log("Teacher", `Decided Q${n} of ${code}`, `Marked ${val === "1" ? "correct" : "wrong"} (${WHY[it.status] || "review"})`); save(); toast("Decision saved"); render(root, ctx);
  });
  root.querySelectorAll("[data-undo]").forEach((b) => b.onclick = () => { const [code, n] = b.dataset.undo.split("|"); delete marks[code].items.find((i) => i.n === +n).decision; save(); render(root, ctx); });
  const cf = $("#confirm"); if (cf) cf.onclick = async () => {
    for (const c of Object.keys(marks)) await deleteByCode(c);
    state.marksConfirmed[task.id] = true; log("Teacher", "Confirmed marks", `${Object.keys(marks).length} books. Photos deleted from this phone.`); save(); toast("Marks confirmed, photos deleted"); render(root, ctx);
  };
  // crops (async, after paint)
  for (const p of [...open, ...decided]) {
    const holder = root.querySelector(`[data-crop="${p.code}|${p.it.n}"]`); if (!holder) continue;
    const pg = photos.filter((x) => x.code === p.code).sort((a, b) => a.page - b.page);
    const src = p.it.A?.box ? p.it.A : p.it.B; const photo = pg[(Number(src?.page) || 1) - 1] || pg[0];
    if (photo) { const c = await cropAnswer(photo.blob, src?.box); holder.innerHTML = `<img class="thumb" alt="${c.cropped ? "Cropped answer" : "Full page"} for ${p.code} question ${p.it.n}" src="${c.url}" style="max-height:200px" /><p class="muted" style="font-size:12px">${c.cropped ? "Cropped to the answer." : "Whole page (answer location not given)."}</p>`; }
    else holder.innerHTML = '<p class="muted" style="font-size:13px">Photo already deleted after confirmation.</p>';
  }
}

function card({ code, it }, key) {
  const task = getTasks()[0], q = task.questions.find((x) => x.n === it.n);
  const row = (label, r) => r ? `<tr><td>${label}</td><td class="mono">${esc(r.read || "none")}</td><td>${(r.legible === false || r.confidence < 0.8) ? '<span class="st st--warn">unclear</span>' : `<span class="st ${r.correct ? "st--ok" : "st--bad"}">${word(r.correct)}</span>`}</td><td class="muted" style="font-size:13px">${esc(r.evidence || "")}</td></tr>` : "";
  const rv = it.reviewer, rvMatch = rv && rv.legible !== false ? sameValue(rv.read, q.answer) : null;
  const decided = it.decision;
  return `<article class="panel-box" data-item="${code}|${it.n}" style="${decided ? "opacity:.85" : ""}">
    <p class="st st--${decided ? "ok" : it.status === "unclear" ? "warn" : "bad"}">${decided ? "You decided: " + word(it.decision.correct) : WHY[it.status] || "Needs you"}</p>
    <h3>${code} ${esc(nameOf(code))}, question ${it.n}: <span class="mono">${esc(q.q)}</span></h3>
    <p class="muted">Memo answer: <strong class="mono">${esc(q.answer)}</strong></p>
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
