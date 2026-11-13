import { state, save, log, api, toast, esc } from "../state.js";
import { proveLesson, allItems } from "../../shared/lesson.js";
import { pretty, fmtFrac, evalExpr } from "../../shared/fractions.js";
import { fmt } from "../../shared/planner.js";
import { canRecord, startRecording, blobToWavBase64 } from "../audio.js";

let sel = null, editing = false, rec = null, busy = "";

export async function render(root, ctx) {
  if (!state.plan) {
    root.innerHTML = `<h1 class="v-title">Teach</h1><p class="v-lede">Plan the term first, then each day has a lesson.</p><button class="btn btn--accent" id="x" type="button">Plan term</button>`;
    root.querySelector("#x").onclick = () => ctx.go(state.atp ? "plan" : "upload"); return;
  }
  const days = state.plan.days.filter((d) => d.kind === "lesson");
  if (!sel || !days.some((d) => d.date === sel)) sel = (days.find((d) => d.date >= state.today) || days[0]).date;
  draw(root, ctx);
}
export function leave() { rec?.cancel(); rec = null; }

function draw(root, ctx) {
  const days = state.plan.days.filter((d) => d.kind === "lesson");
  const day = days.find((d) => d.date === sel), entry = state.lessons[sel];
  root.innerHTML = `
    <h1 class="v-title">${esc(day.topic)}</h1>
    <p class="v-lede">Outline, examples, class work, homework and memo for one lesson, from your plan.</p>
    <div class="field-inline" style="margin-bottom:20px"><label for="day-sel">Lesson day</label>
      <select id="day-sel" style="font:inherit;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);max-width:100%">
      ${days.map((d) => `<option value="${d.date}" ${d.date === sel ? "selected" : ""}>${fmt(d.date)}: ${esc(d.topic)}${state.lessons[d.date] ? "" : " (not written)"}</option>`).join("")}</select></div>
    <div id="lesson-area">${entry ? lessonHtml(entry, day) : `<div class="panel-box"><p>No lesson written for ${fmt(sel)} yet.</p>
      <div class="btn-row"><button class="btn btn--accent" id="write" type="button" ${busy ? "disabled" : ""}>Write this lesson</button></div>
      ${busy ? `<p class="loading" role="status">${esc(busy)}</p>` : ""}</div>`}</div>`;
  root.querySelector("#day-sel").onchange = (e) => { sel = e.target.value; editing = false; draw(root, ctx); };
  const w = root.querySelector("#write"); if (w) w.onclick = () => writeLesson(root, ctx, day);
  if (entry) wire(root, ctx, entry, day);
}

export function focus(date) { sel = date; editing = false; }
// Writes (or re-writes) the lesson for one plan day. Any re-teach block on that day goes first, and the new content is trimmed to fit.
export async function generateLesson(day, why = "Wrote lesson") {
  const rts = day.blocks.filter((b) => b.type === "reteach"), nw = day.blocks.find((b) => b.type === "new");
  const mins = 60;
  const r = await api("/api/write-lesson", { topic: day.topic, atpWeek: day.atpWeek, minutes: mins, reteach: rts.length ? { topic: rts.map((b) => b.label.replace("Re-teach: ", "")).join(" and "), minutes: rts.reduce((s, b) => s + b.minutes, 0) } : null });
  store(day, proveLesson(r.lesson, { topic: day.topic, topicId: day.topicId, atpWeek: day.atpWeek, date: day.date, minutes: mins }), why, r.meta);
}
async function writeLesson(root, ctx, day) {
  busy = "Lesson Writer is writing the lesson"; draw(root, ctx);
  try { await generateLesson(day); } catch (e) { toast(e.message); }
  busy = ""; draw(root, ctx);
}
function store(day, L, action, meta) {
  const prev = state.lessons[day.date];
  state.lessons[day.date] = { date: day.date, topic: day.topic, topicId: day.topicId, atpWeek: day.atpWeek, lesson: L, approved: false, prev: prev ? prev.lesson : null };
  log("Lesson Writer", action, `${fmt(day.date)}: ${day.topic}. ${L.unproven} item(s) not proven by calculation, ${L.corrected} memo answer(s) corrected by code`, meta); save();
}

function qHtml(i) { return `<li data-id="${i.id}">${esc(pretty(i.q))}${i.proven ? "" : ' <span class="st st--warn">not proven by calculation</span>'}</li>`; }
function mHtml(i) { return `<li>${esc(pretty(i.q))} <strong>${esc(pretty(i.answer || "?"))}</strong>${i.corrected ? ` <span class="st st--warn">model said ${esc(i.corrected)}, code corrected it</span>` : ""}${i.proven ? ' <span class="st st--ok">proven</span>' : ' <span class="st st--warn">check this answer yourself</span>'}</li>`; }

function lessonHtml(e, day) {
  const L = e.lesson;
  if (editing) return editHtml(e);
  const rt = day.blocks.find((b) => b.type === "reteach");
  return `<div class="print-area" id="lesson">
    <p class="mono muted" style="font-size:13px" id="atp-tag">ATP week ${e.atpWeek} · ${esc(e.topic)} · CAPS Grade 6 Maths Term 4 · ${fmt(e.date)}</p>
    <p class="st ${e.approved ? "st--ok" : "st--warn"}" id="lesson-status">${e.approved ? "Approved by you" : "Draft, waiting for you"}</p>
    ${rt ? `<p class="notice" style="margin:10px 0">Class re-teach added by the Analyst: ${esc(rt.label)}, ${rt.minutes} minutes.</p>` : ""}
    <div class="panel-box"><h3>Outline <span class="muted" style="font-weight:400">(${L.outline.reduce((s, o) => s + o.minutes, 0)} minutes)</span></h3>
      <ol id="outline">${L.outline.map((o) => `<li>${esc(pretty(o.step))} <span class="mono muted">${o.minutes} min</span></li>`).join("")}</ol></div>
    <div class="grid2"><div class="panel-box"><h3>Worked examples</h3><ol id="examples">${L.examples.map(qHtml).join("")}</ol></div>
    <div class="panel-box"><h3>Class work</h3><ol id="classwork">${L.classWork.map(qHtml).join("")}</ol></div></div>
    <div class="panel-box"><h3>Homework</h3><ol id="homework-list">${L.homework.map(qHtml).join("")}</ol></div>
    <div class="panel-box memo"><h3>Memo</h3><p class="muted" style="font-size:14px">Answers are worked out by code, not by the model.${L.unproven ? ` ${L.unproven} item(s) could not be proven and need your check.` : " Every answer is proven."}</p>
      <ol id="memo">${allItems(L).map(mHtml).join("")}</ol></div></div>
    <div class="btn-row no-print">
      <button class="btn btn--ghost" id="print" type="button">Print</button>
      <button class="btn btn--ghost" id="edit" type="button">Edit</button>
      ${e.prev ? `<button class="btn btn--ghost" id="undo" type="button">Undo last change</button>` : ""}
      ${e.approved ? "" : `<button class="btn btn--accent" id="approve" type="button">Approve lesson</button>`}
    </div>
    <div class="panel-box no-print" id="voice"><h3>Change it by voice note</h3>
      <p class="muted" style="font-size:14px">Say, for example, "make it shorter". Or type it.</p>
      <div class="btn-row">${canRecord() ? `<button class="btn btn--ghost" id="rec" type="button">${rec ? "Stop and send" : "Record voice note"}</button>` : ""}</div>
      <form id="vtext" class="field-inline"><label for="vt" class="sr-only">Type your change</label><input id="vt" placeholder="Make it shorter" style="flex:1;min-width:180px" />
        <button class="btn" type="submit" id="vsend">Send</button></form>
      ${busy ? `<p class="loading" role="status" id="vbusy">${esc(busy)}</p>` : ""}
      ${e.lastVoice ? `<p class="muted" style="font-size:14px;margin-top:10px" id="heard">Heard: "${esc(e.lastVoice)}"</p>` : ""}</div>`;
}

function editHtml(e) {
  const L = e.lesson;
  const row = (i, sec, n) => i.kind === "calc" ? `<div class="field-inline"><label>Q${n}</label><input data-sec="${sec}" data-n="${n - 1}" data-f="expr" value="${esc(i.expr)}" /></div>`
    : i.kind === "simplify" ? `<div class="field-inline"><label>Q${n}</label><input data-sec="${sec}" data-n="${n - 1}" data-f="from" value="${esc(i.from)}" size="8" /><span>simplify</span></div>`
    : i.kind === "equiv" ? `<div class="field-inline"><label>Q${n}</label><input data-sec="${sec}" data-n="${n - 1}" data-f="from" value="${esc(i.from)}" size="6" /><span>= ?/</span><input data-sec="${sec}" data-n="${n - 1}" data-f="toDen" value="${esc(i.toDen)}" size="3" /></div>`
    : `<div class="field-inline"><label>Q${n}</label><input data-sec="${sec}" data-n="${n - 1}" data-f="q" value="${esc(i.q)}" style="flex:1" /><input data-sec="${sec}" data-n="${n - 1}" data-f="answer" value="${esc(i.answer)}" size="10" /></div>`;
  return `<div class="panel-box" id="edit-box"><h3>Edit lesson</h3><p class="muted" style="font-size:14px">Outline: one step per line, as "step | minutes". Answers are re-worked by code when you save.</p>
    <textarea id="ed-outline" rows="${L.outline.length + 1}" style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px">${esc(L.outline.map((o) => `${o.step} | ${o.minutes}`).join("\n"))}</textarea>
    ${["examples", "classWork", "homework"].map((s) => `<h4 style="margin:16px 0 6px">${s === "classWork" ? "Class work" : s[0].toUpperCase() + s.slice(1)}</h4>${L[s].map((i, n) => row(i, s, n + 1)).join("")}`).join("")}
    <div class="btn-row"><button class="btn btn--accent" id="save-edit" type="button">Save changes</button><button class="btn btn--ghost" id="cancel-edit" type="button">Cancel</button></div></div>`;
}

function wire(root, ctx, e, day) {
  const $ = (s) => root.querySelector(s);
  if (editing) {
    $("#cancel-edit").onclick = () => { editing = false; draw(root, ctx); };
    $("#save-edit").onclick = () => {
      const raw = structuredClone(e.lesson);
      raw.outline = $("#ed-outline").value.split("\n").filter(Boolean).map((l) => { const [s, m] = l.split("|"); return { step: s.trim(), minutes: Number(m) || 0 }; });
      root.querySelectorAll("[data-sec]").forEach((inp) => { raw[inp.dataset.sec][+inp.dataset.n][inp.dataset.f] = inp.value; });
      store(day, proveLesson(raw, { topic: e.topic, topicId: e.topicId, atpWeek: e.atpWeek, date: e.date, minutes: e.lesson.minutes }), "Teacher edited lesson", null);
      editing = false; toast("Saved. Answers re-worked."); draw(root, ctx);
    };
    return;
  }
  $("#print").onclick = () => window.print();
  $("#edit").onclick = () => { editing = true; draw(root, ctx); };
  const ap = $("#approve"); if (ap) ap.onclick = () => { e.approved = true; log("Teacher", "Approved lesson", `${fmt(e.date)}: ${e.topic}`); save(); draw(root, ctx); };
  const un = $("#undo"); if (un) un.onclick = () => { store(day, e.prev, "Teacher undid the last change", null); draw(root, ctx); };
  async function send(payload, label) {
    busy = label; draw(root, ctx);
    try {
      const r = await api("/api/voice-edit", { ...payload, lesson: { ...e.lesson, topic: e.topic } });
      const L = proveLesson(r.lesson, { topic: e.topic, topicId: e.topicId, atpWeek: e.atpWeek, date: e.date, minutes: Math.round(r.lesson.outline?.reduce((s, o) => s + (Number(o.minutes) || 0), 0)) || e.lesson.minutes });
      store(day, L, `Voice edit: "${r.transcript}"`, r.metas?.[r.metas.length - 1]);
      state.lessons[sel].lastVoice = r.transcript; save();
    } catch (err) { toast(err.message); }
    busy = ""; draw(root, ctx);
  }
  $("#vtext").onsubmit = (ev) => { ev.preventDefault(); const t = $("#vt").value.trim() || "Make it shorter"; send({ text: t }, "Lesson Writer is changing the lesson"); };
  const rb = $("#rec");
  if (rb) rb.onclick = async () => {
    try {
      if (!rec) { rec = await startRecording(); rb.textContent = "Stop and send"; return; }
      const blob = await rec.stop(); rec = null; rb.textContent = "Record voice note";
      send({ audio: await blobToWavBase64(blob) }, "Listening to your voice note, then changing the lesson");
    } catch (err) { rec = null; toast("Microphone not available: " + err.message); }
  };
}
