import { state, save, log, api, toast, esc } from "../state.js";
import { getTasks } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { buildHomework, codeBank, proveBank, minutesFor } from "../../shared/homework.js";
import { proveItem } from "../../shared/lesson.js";
import { pretty } from "../../shared/fractions.js";
import { TOPICS } from "../../shared/assessment.js";
import { fmt } from "../../shared/planner.js";
import { printHtml } from "../print.js";
import { snapshot, qrSvg, qrPayload } from "../../shared/hwmark.js";

let sel = null, busy = "";
const topicName = (id) => TOPICS.find((t) => t.id === id)?.name || id;
// Approving freezes the sheet: this snapshot (own questions and proven memo, with its id) is what a snapped page is marked against.
function approve(c) {
  const s = state.homework[c]; s.approved = true; s.round = s.round || state.hwRound;
  const snap = snapshot(s, s.round); s.sheetId = snap.id; (state.hwSheets ||= {})[snap.id] = snap;
}
const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || "";

export async function render(root, ctx) {
  ensureLearners();
  if (!Object.keys(state.marks[getTasks()[0].id] || {}).length) {
    root.innerHTML = `<h1 class="v-title">Personal homework</h1><p class="v-lede">Mark some books first. Each learner then gets homework on exactly what they got wrong.</p><div class="btn-row"><button class="btn btn--accent" id="x" type="button">Snap books</button></div>`;
    root.querySelector("#x").onclick = () => ctx.go("snap"); return;
  }
  draw(root, ctx);
}

async function generate(root, ctx) {
  const tasks = getTasks(); busy = "Lesson Writer is writing a question bank for each topic"; draw(root, ctx);
  let bank, source = "Lesson Writer", meta = null;
  try { const r = await api("/api/write-bank", { topics: TOPICS.map((t) => t.id) }); bank = proveBank(r.bank); meta = r.meta; }
  catch (e) { source = "Chommie's built-in bank (the model was not available)"; }
  for (const t of TOPICS) if (!bank?.[t.id] || bank[t.id].practice.length < 3 || bank[t.id].stretch.length < 1) { bank = bank || {}; bank[t.id] = proveBank(codeBank("fallback"))[t.id]; source += "; some topics from the built-in bank"; }
  state.bank = bank;
  const fresh = buildHomework({ marks: state.marks, tasks, bank, settings: state.settings });
  const old = state.homework || {};
  const rt = (state.tasks || []).find((t) => t.id === "hw-r" + state.hwRound);
  const bumped = rt && Object.keys(state.marks[rt.id] || {}).length > 0;
  if (bumped) state.hwRound++; // the last round has been marked: this is the next round
  for (const [c, s] of Object.entries(fresh)) if (!bumped && old[c]?.edited) fresh[c] = old[c]; // never overwrite a teacher's edits
  for (const s of Object.values(fresh)) s.round ||= state.hwRound;
  state.homework = fresh;
  log("Lesson Writer", "Wrote personal homework", `${Object.keys(fresh).length} learners. Questions from: ${source}. Every answer proven by calculation.`, meta); save();
  busy = ""; draw(root, ctx);
}

function draw(root, ctx) {
  const hw = state.homework, codes = hw ? Object.keys(hw).sort() : [];
  if (codes.length && !hw[sel]) sel = codes[0];
  root.innerHTML = `
    <h1 class="v-title">A sheet for each learner, with their name on it.</h1>
    <p class="v-lede">Each sheet is built from the questions that learner got wrong, plus practice on the same topic. Learners who are ahead get stretch questions. You can change any question before it is printed.</p>
    ${!hw ? `<div class="btn-row"><button class="btn btn--accent" id="gen" type="button" ${busy ? "disabled" : ""}>Write personal homework</button></div>${busy ? `<p class="loading" role="status">${esc(busy)}</p>` : ""}` : `
    <div class="grid2"><div class="panel-box"><h3>Learners (${codes.length})</h3>
      <table class="tbl" id="hw-list"><tbody>${codes.map((c) => { const s = hw[c]; return `<tr data-hw="${c}" style="cursor:pointer;${c === sel ? "background:var(--soft)" : ""}"><td><button class="btn btn--ghost" data-pick="${c}" type="button" style="min-height:44px;width:100%;justify-content:flex-start;text-align:left;border:0">${c} ${esc(nameOf(c))}</button></td>
        <td class="muted" style="font-size:13px">${s.stretch ? "stretch" : s.topics.length + " topic" + (s.topics.length === 1 ? "" : "s")}</td><td><span class="st ${s.approved ? "st--ok" : "st--warn"}">${s.approved ? "Approved" : "Draft"}</span></td></tr>`; }).join("")}</tbody></table>
      <div class="btn-row"><button class="btn btn--ghost" id="approve-all" type="button">Approve all</button><button class="btn btn--accent" id="print-all" type="button" ${codes.some((c) => hw[c].approved) ? "" : "disabled"}>Print approved sheets</button></div></div>
    <div id="sheet">${sheetHtml(hw[sel])}</div></div>`}`;
  const $ = (s) => root.querySelector(s);
  const g = $("#gen"); if (g) g.onclick = () => generate(root, ctx);
  if (!hw) return;
  root.querySelectorAll("[data-pick]").forEach((b) => b.onclick = () => { sel = b.dataset.pick; draw(root, ctx); });
  $("#approve-all").onclick = () => { codes.forEach((c) => approve(c)); log("Teacher", "Approved all homework", `${codes.length} sheets`); save(); draw(root, ctx); };
  $("#print-all").onclick = () => printSheets(root, codes.filter((c) => hw[c].approved));
  wireSheet(root, ctx);
}

function sheetHtml(s) {
  if (!s) return "";
  const q = (i, n) => `<li data-item="${n}"><span>${esc(pretty(i.q))}</span> <span class="mono muted" style="font-size:12px">${i.source === "retry" ? "Try again" : i.source === "stretch" ? "Stretch" : "Practice"}</span>
    <input class="hw-edit sr-only-until-edit" hidden data-n="${n}" value="${esc(i.expr || i.from || i.q)}" /></li>`;
  return `<div class="panel-box"><h3 id="sheet-title">${s.code} ${esc(nameOf(s.code))}</h3>
    <p class="muted" style="font-size:14px">${s.stretch ? "Ahead of the class on every topic, so this sheet is stretch questions." : "Missed: " + s.topics.map(topicName).join(", ")}. About ${minutesFor(s)} minutes.</p>
    <ol id="hw-items">${s.items.map(q).join("")}</ol>
    <details><summary style="cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600">Memo (teacher only)</summary><ol id="hw-memo">${s.items.map((i) => `<li>${esc(pretty(i.q))} <strong class="mono">${esc(pretty(i.answer))}</strong> <span class="st st--ok">proven</span></li>`).join("")}</ol></details>
    <div class="btn-row"><button class="btn btn--ghost" id="hw-edit" type="button">Change questions</button>
      ${s.approved ? `<span class="st st--ok">Approved</span><button class="btn btn--ghost" id="hw-print" type="button">Print this sheet</button>` : `<button class="btn btn--accent" id="hw-approve" type="button">Approve this sheet</button>`}</div></div>`;
}

function wireSheet(root, ctx) {
  const s = state.homework[sel]; if (!s) return; const $ = (x) => root.querySelector(x);
  const ap = $("#hw-approve"); if (ap) ap.onclick = () => { approve(sel); log("Teacher", "Approved homework", sel); save(); draw(root, ctx); };
  const pr = $("#hw-print"); if (pr) pr.onclick = () => printSheets(root, [sel]);
  $("#hw-edit").onclick = () => {
    const box = $("#hw-items"); box.querySelectorAll("input").forEach((i) => (i.hidden = false)); box.querySelectorAll("li > span").forEach((x) => (x.style.display = "none"));
    $("#hw-edit").textContent = "Save changes";
    $("#hw-edit").onclick = () => {
      const keep = [];
      box.querySelectorAll("input").forEach((inp) => {
        const n = +inp.dataset.n, old = s.items[n], v = inp.value.trim(); if (!v) return; // an emptied line removes the question
        if (v === (old.expr || old.from || old.q)) { keep.push(old); return; }
        const raw = old.kind === "equiv" ? { kind: "equiv", from: v, toDen: old.toDen } : old.kind === "simplify" ? { kind: "simplify", from: v } : { kind: "calc", expr: v };
        const p = proveItem(raw); keep.push({ ...old, ...p, topicId: old.topicId, source: old.source, id: old.id });
      });
      s.items = keep; s.edited = true; s.approved = false; log("Teacher", "Edited homework", sel + ". Answers re-worked by code."); save(); toast("Saved. Answers re-worked."); draw(root, ctx);
    };
  };
}

// One A4 page per learner, with the learner's real name restored from this phone only at this moment.
function printSheets(root, codes) {
  const html = codes.map((c) => { const s = state.homework[c], id = s.sheetId;
    return `<section class="hw-sheet" data-code="${c}" data-sheet-id="${esc(id)}"><header class="hw-strip"><p class="hw-sheet-class">Grade 6B Mathematics, Term 4. Fractions homework, round ${s.round}. Set ${fmt(state.today)}</p>
      <h2 class="hw-sheet-name">${esc(nameOf(c))}</h2></header>
      <div class="hw-idrow"><div><p class="hw-code">${c}</p><p class="muted" style="margin:4px 0 0">Homework round ${s.round}</p></div><div class="hw-qr" data-qr="${esc(qrPayload(c, id))}">${qrSvg(qrPayload(c, id))}</div></div>
      <p>${s.stretch ? "Stretch questions: you are ahead of the class. Show your working." : "Practise these. Show your working."} About ${minutesFor(s)} minutes.</p>
      <ol>${s.items.map((i) => `<li>${esc(pretty(i.q))}<div class="hw-line"></div></li>`).join("")}</ol>
      <footer class="hw-sheet-foot">Sheet ${esc(id)} | ${c}</footer></section>`; }).join("");
  log("Teacher", "Printed homework", `${codes.length} sheet(s), one per learner with the learner's name, code and QR`);
  printHtml(html);
}
