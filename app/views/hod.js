import { state, save, log, toast, esc } from "../state.js";
import { getTasks } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { buildHeat, topicDecisions, ACTION_TEXT } from "../../shared/analyst.js";
import { markSheet, toXls } from "../../shared/export.js";
import { revisionMinutesLeft, fmt } from "../../shared/planner.js";
import { finalCorrect } from "../../shared/marking.js";
import { printHtml } from "../print.js";

let absentAll = false;
export async function render(root, ctx) { ensureLearners(); draw(root, ctx); }

function draw(root, ctx) {
  const tasks = getTasks(), S = state.settings, heat = buildHeat(state.marks, tasks), dec = topicDecisions(heat, S);
  const formal = tasks.filter((t) => t.type === "formal"), informal = tasks.filter((t) => t.type !== "formal");
  const sheet = markSheet({ tasks, marks: state.marks, learners: state.learners, absentAsMinusOne: absentAll });
  const calls = state.log.filter((e) => e.meta), byModel = {};
  for (const e of calls) { const k = e.meta.model; (byModel[k] ||= { vendor: e.meta.vendor, routing: e.meta.routing, n: 0, tokens: 0, cost: 0 }); byModel[k].n++; byModel[k].tokens += e.meta.tokens || 0; byModel[k].cost += e.meta.cost || 0; }
  const confirmed = formal.every((t) => state.marksConfirmed[t.id]) && formal.length > 0;
  const signed = !!state.hod.signed;
  root.innerHTML = `
    <h1 class="v-title">The class in one page, for the HOD.</h1>
    <p class="v-lede">Grade 6 Maths, Term 4, fractions. Counts only: no learner names on this overview. Chommie's marks are the teacher's, approved by the teacher.</p>
    <div class="grid2">
      <div class="panel-box"><h3>Fractions topics</h3>
        <table class="tbl" id="hod-topics"><thead><tr><th>Topic</th><th>Struggling</th><th>Decision</th></tr></thead><tbody>
        ${dec.map((d) => `<tr><td>${esc(d.name)}</td><td class="mono">${d.assessed ? `${d.struggling.length} of ${d.assessed}` : "-"}</td><td class="st ${d.action === "reteach" ? "st--bad" : d.action === "homework" ? "st--warn" : "st--ok"}">${ACTION_TEXT[d.action]}</td></tr>`).join("")}</tbody></table></div>
      <div class="panel-box"><h3>Term pace</h3>
        ${state.plan ? `<p>All ATP topics are planned before the test on <strong>${fmt(state.plan.term.test)}</strong> (exam ${fmt(state.plan.term.exam)}).</p><p>Revision time left before the test: <strong>${revisionMinutesLeft(state.plan)} minutes</strong>. Re-teaches added: ${state.plan.reteaches.length}.</p>${state.plan.warnings.map((w) => `<p class="notice notice--bad">${esc(w)}</p>`).join("")}` : '<p class="muted">No term plan yet.</p>'}
        <p>Learners marked: <strong>${Object.keys(heat).length}</strong>. Tasks: ${formal.length} formal (recorded), ${informal.length} informal (not recorded).</p></div>
    </div>
    <div class="panel-box"><h3>Every AI call, with vendor and routing</h3>
      ${calls.length ? `<div style="overflow-x:auto"><table class="tbl" id="ai-log"><thead><tr><th>Model</th><th>Vendor</th><th>Routing</th><th>Calls</th><th>Cost (USD)</th></tr></thead><tbody>${Object.entries(byModel).map(([m, v]) => `<tr><td class="mono" style="font-size:13px">${esc(m)}</td><td>${esc(v.vendor)}</td><td class="muted" style="font-size:13px">${esc(v.routing)}</td><td>${v.n}</td><td class="mono">${v.cost.toFixed(4)}</td></tr>`).join("")}</tbody></table></div>
      <p class="muted" style="font-size:14px">Photos reach AI vendors outside South Africa. Fine for made-up demo learners; a real pilot needs a POPIA section 72 decision first.</p>` : '<p class="muted">No AI calls on this phone yet.</p>'}</div>
    <div class="panel-box" id="signoff"><h3>HOD sign-off and SA-SAMS export</h3>
      ${!formal.length ? '<p class="muted">No formal task yet. Only formal tasks (recorded and moderated) go to the record sheet and export. Informal work only feeds the struggling view. Set a task to formal on the Mark screen.</p>' : `
      <p class="muted">Formal tasks: ${formal.map((t) => esc(t.name)).join(", ")}.</p>
      ${sheet.missing.length ? `<p class="notice notice--bad" role="alert">${sheet.missing.length} learner(s) have no mark (no consent or not marked). SA-SAMS allows no blanks.</p>
        <label style="display:flex;gap:10px;align-items:center;min-height:44px"><input type="checkbox" id="absent" ${absentAll ? "checked" : ""} style="width:22px;height:22px" /> They were absent with a valid reason (enter -1)</label>` : ""}
      <div class="btn-row"><button class="btn btn--ghost" id="print-sheet" type="button" ${confirmed ? "" : "disabled"}>Print mark sheet for HOD signing</button><button class="btn btn--ghost" id="print-pack" type="button" ${confirmed ? "" : "disabled"}>Print moderation evidence pack</button></div>
      ${!confirmed ? '<p class="muted" style="font-size:14px">The teacher must confirm the marks in Check first.</p>' : ""}
      ${signed ? `<p class="st st--ok" id="signed">Signed by ${esc(state.hod.name)} on ${esc(state.hod.at.slice(0, 10))}.</p>` : `
      <div class="field-inline" style="margin-top:12px"><label for="hod-name">HOD name</label><input id="hod-name" placeholder="HOD name" /><button class="btn btn--accent" id="sign" type="button" ${confirmed ? "" : "disabled"}>Sign off marks</button></div>`}
      <div class="btn-row"><button class="btn btn--accent" id="export" type="button" ${signed ? "" : "disabled"}>Export .xls for SA-SAMS</button></div>
      <p id="export-note" class="muted" style="font-size:14px">${signed ? "Import once only, with Menu 12.3.12.2, after HOD approval. Task totals and dates cannot be changed after import. SA-SAMS has no encryption, so keep the file off shared USB sticks." : "Export is locked until the HOD signs."}</p>`}
    </div>`;
  const $ = (s) => root.querySelector(s);
  const ab = $("#absent"); if (ab) ab.onchange = () => { absentAll = ab.checked; draw(root, ctx); };
  const sg = $("#sign"); if (sg) sg.onclick = () => {
    const n = $("#hod-name").value.trim(); if (!n) { toast("Enter the HOD's name"); return; }
    state.hod = { signed: true, name: n, at: new Date().toISOString(), tasks: formal.map((t) => t.id) }; log("HOD", "Signed off formal marks", `${n}. Tasks: ${formal.map((t) => t.name).join(", ")}`); save(); draw(root, ctx);
  };
  const ex = $("#export"); if (ex) ex.onclick = () => {
    try {
      const { xml, filename } = toXls(markSheet({ tasks, marks: state.marks, learners: state.learners, absentAsMinusOne: absentAll }));
      const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel" })); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      log("Teacher", "Exported mark sheet", `${filename}. Formal tasks only, after HOD sign-off.`); save(); toast("Exported " + filename); window.__lastExport = { filename, xml };
    } catch (e) { toast(e.message); }
  };
  const ps = $("#print-sheet"); if (ps) ps.onclick = () => printHtml(sheetHtml(sheet));
  const pp = $("#print-pack"); if (pp) pp.onclick = () => printHtml(packHtml(formal));
}

function sheetHtml(sheet) {
  return `<section class="hw-sheet"><h2 class="hw-sheet-name">Mark sheet for HOD signing</h2><p>Grade 6B Mathematics, Term 4. Formal tasks only.</p>
    <table class="sheet-table"><thead><tr><th>Learner</th><th>Name</th>${sheet.formal.map((t) => `<th>${esc(t.name)}<br>/${t.total}, ${esc(t.date)}</th>`).join("")}</tr></thead><tbody>
    ${sheet.rows.map(({ l, cells }) => `<tr><td>${l.code}</td><td>${esc(l.name)}</td>${cells.map((c) => `<td>${c === null ? "" : c}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <p style="margin-top:12px;font-size:13px">-1 means absent with a valid reason.</p>
    <div class="sign-line">HOD signature and date</div><div class="sign-line">Teacher signature and date</div></section>`;
}
function packHtml(formal) {
  return formal.map((t) => `<section class="hw-sheet"><h2 class="hw-sheet-name">Moderation evidence pack: ${esc(t.name)}</h2><p>Date ${esc(t.date)}. Total ${t.total}. Book photos are deleted once marks are confirmed (consent rules), so this pack holds the memo, the mark list and what both markers read.</p>
    <h3>Memo</h3><ol>${t.questions.map((q) => `<li>${esc(q.plain)} = <strong>${esc(q.answer)}</strong></li>`).join("")}</ol>
    <h3>Mark list</h3><table class="sheet-table"><thead><tr><th>Learner</th>${t.questions.map((q) => `<th>Q${q.n}</th>`).join("")}<th>Total</th></tr></thead><tbody>
    ${Object.values(state.marks[t.id] || {}).map((m) => `<tr><td>${m.code}</td>${t.questions.map((q) => { const it = m.items.find((i) => i.n === q.n); const f = it ? finalCorrect(it) : null; return `<td title="${esc(it?.A?.read || "")}">${f === true ? "1" : f === false ? "0" : "?"} <span style="font-size:10px">${esc(it?.A?.read || "")}</span></td>`; }).join("")}<td>${m.items.filter((i) => finalCorrect(i)).length}</td></tr>`).join("")}</tbody></table></section>`).join("");
}
