import { state, save, log, toast, esc } from "../state.js";
import { loopSteps, nextStep, termGoal } from "../../shared/coordinator.js";
import { listPhotos } from "../db.js";
import { getTasks } from "../orchestrator.js";
import { fmt } from "../../shared/planner.js";

export async function render(root, ctx) {
  const queued = new Set((await listPhotos()).filter((p) => p.status === "queued").map((p) => p.code)).size;
  draw(root, ctx, queued);
}
function draw(root, ctx, queued) {
  const task = getTasks()[0], tm = state.marks[task.id] || {};
  const pending = Object.values(tm).reduce((s, m) => s + m.items.filter((i) => i.status !== "agree" && !i.decision).length, 0);
  const hw = Object.values(state.homework || {}), lessons = Object.values(state.lessons);
  const items = [];
  if (state.atp) items.push({ k: "atp", title: "ATP read from your photo", done: state.atpApproved, approve: () => (state.atpApproved = true), go: "upload" });
  if (state.plan) items.push({ k: "plan", title: "Term plan", done: state.planApproved, approve: () => (state.planApproved = true), go: "plan" });
  lessons.forEach((l) => items.push({ k: "lesson-" + l.date, title: `Lesson: ${l.topic}, ${fmt(l.date)}`, done: l.approved, approve: () => (l.approved = true), go: "teach" }));
  if (hw.length) items.push({ k: "hw", title: `Personal homework: ${hw.filter((h) => h.approved).length} of ${hw.length} sheets approved`, done: hw.every((h) => h.approved), approve: () => hw.forEach((h) => (h.approved = true)), go: "homework" });
  if (Object.keys(tm).length) items.push({ k: "marks", title: `Marks for ${task.name}: ${pending ? pending + " item(s) need you" : "all decided"}`, done: !!state.marksConfirmed[task.id], go: "check" });
  const formal = state.tasks.filter((t) => t.type === "formal");
  if (formal.length) items.push({ k: "hod", title: "HOD sign-off before export", done: !!state.hod.signed, go: "hod" });
  const waiting = items.filter((i) => !i.done), done = items.filter((i) => i.done);
  const steps = loopSteps(state, { queued }), goal = termGoal(state), nx = nextStep(state, { queued });
  root.innerHTML = `
    <h1 class="v-title">Chommie drafts. You decide.</h1>
    <p class="v-lede">Everything Chommie has drafted waits here for you. Nothing is used until you approve it, and every step is written in the log below.</p>
    <div class="panel-box"><h3>Waiting for you (${waiting.length})</h3>
      <table class="tbl" id="waiting"><tbody>${waiting.map((i) => `<tr data-k="${i.k}"><td>${esc(i.title)}</td><td style="text-align:right;white-space:nowrap"><button class="btn btn--ghost" data-go="${i.go}" type="button">Open</button> ${i.approve ? `<button class="btn btn--accent" data-approve="${i.k}" type="button">Approve</button>` : ""}</td></tr>`).join("") || '<tr><td class="muted">Nothing is waiting.</td></tr>'}</tbody></table></div>
    ${done.length ? `<div class="panel-box"><h3>Approved (${done.length})</h3><ul class="checks-list" id="approved">${done.map((i) => `<li>${esc(i.title)} <span class="st st--ok">approved</span></li>`).join("")}</ul></div>` : ""}
    <div class="panel-box"><h3>The weekly loop</h3>
      ${goal ? `<p class="muted" id="term-goal">Term goal: all ${goal.topicsPlanned} ATP topics taught before the test on ${fmt(goal.test)} (exam ${fmt(goal.exam)}). ${goal.taught} of ${goal.lessonDays} lesson days done.</p>` : ""}
      <ol id="loop">${steps.map((s) => `<li class="${s.done ? "" : s.id === nx.id ? "is-now" : ""}"><span class="st ${s.done ? "st--ok" : s.id === nx.id ? "st--warn" : "st--na"}">${s.done ? "Done" : s.id === nx.id ? "Next" : "Later"}</span> ${esc(s.label)} <span class="muted" style="font-size:13px">(${esc(s.agent)})</span></li>`).join("")}</ol>
      <p class="muted" style="font-size:14px">Then repeat each week, re-planning when the 40% rule says so, until the term goal is met.</p></div>
    <div class="panel-box"><h3>Activity log (${state.log.length})</h3>
      <div style="overflow-x:auto"><table class="tbl" id="log"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Model, vendor and routing</th></tr></thead><tbody>
      ${[...state.log].reverse().slice(0, 200).map((e) => `<tr><td class="mono" style="font-size:12px;white-space:nowrap">${esc(e.at.slice(5, 16).replace("T", " "))}</td><td>${esc(e.agent)}</td><td>${esc(e.action)}<br><span class="muted" style="font-size:13px">${esc(e.detail)}</span></td><td class="muted" style="font-size:12px">${e.meta ? esc(`${e.meta.model} (${e.meta.vendor}). ${e.meta.routing}`) : ""}</td></tr>`).join("") || '<tr><td colspan="4" class="muted">No steps yet.</td></tr>'}
      </tbody></table></div></div>`;
  root.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => ctx.go(b.dataset.go));
  root.querySelectorAll("[data-approve]").forEach((b) => b.onclick = () => { const it = items.find((i) => i.k === b.dataset.approve); it.approve(); log("Teacher", "Approved", it.title); save(); toast("Approved"); draw(root, ctx, queued); });
}
