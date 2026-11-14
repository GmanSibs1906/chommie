import { state, save, log, toast, esc } from "../state.js";
import { getTasks } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { buildHeat, topicDecisions, cellState, ACTION_TEXT } from "../../shared/analyst.js";
import { TOPICS } from "../../shared/assessment.js";
import { addReteach, fmt } from "../../shared/planner.js";
import { generateLesson, focus } from "./teach.js";

let busy = "";
const SYMBOL = { red: "Re-teach", amber: "Shaky", green: "Got it", pending: "?", none: "-" };

export function nextLessonDay(plan, today) { return plan.days.find((d) => d.date > today && (d.kind === "lesson" || d.kind === "revision")); }

export async function render(root, ctx) {
  ensureLearners(); draw(root, ctx);
}
function draw(root, ctx) {
  const tasks = getTasks(), heat = buildHeat(state.marks, tasks), S = state.settings, decisions = topicDecisions(heat, S);
  const codes = Object.keys(heat).sort(), names = Object.fromEntries((state.learners || []).map((l) => [l.code, l.name]));
  if (!codes.length) {
    root.innerHTML = `<h1 class="v-title">Class heat map</h1><p class="v-lede">Mark some books and every learner will appear here against every fractions topic. Or open the demo run.</p>
      <div class="btn-row"><button class="btn btn--accent" id="to-snap" type="button">Snap books</button><button class="btn btn--ghost" id="to-demo" type="button">Load demo run</button></div>`;
    root.querySelector("#to-snap").onclick = () => ctx.go("snap"); root.querySelector("#to-demo").onclick = () => document.getElementById("btn-demo").click(); return;
  }
  const pend = codes.reduce((s, c) => s + Object.values(heat[c]).reduce((a, x) => a + x.pending, 0), 0);
  const rt = decisions.filter((d) => d.action === "reteach");
  const target = state.plan && nextLessonDay(state.plan, state.today);
  root.innerHTML = `
    <h1 class="v-title">The whole class, at a glance.</h1>
    <p class="v-lede">${codes.length} learners, one square for each fractions topic. A learner under <strong>${S.struggle}%</strong> on a topic is struggling. When <strong>${S.reteach}%</strong> or more of the class is struggling, Chommie proposes a short class re-teach.</p>
    <p class="muted" id="heat-sources">Counted: ${tasks.filter((t) => Object.keys(state.marks[t.id] || {}).length).map((t) => esc(t.name)).join(", ")}.</p>
    ${pend ? `<p class="notice notice--bad" role="status">${pend} answer(s) are waiting for your decision in Check and are not counted yet.</p>` : ""}
    <div class="panel-box" style="overflow-x:auto"><table class="tbl hm2" id="heat" aria-label="Heat map: learners against topics">
      <thead><tr><th>Learner</th>${TOPICS.map((t) => `<th title="${esc(t.name)}">${t.short}</th>`).join("")}</tr></thead><tbody>
      ${codes.map((c) => `<tr data-code="${c}"><td><span class="mono">${c}</span> ${esc(names[c] || "")}</td>${TOPICS.map((t) => { const cell = heat[c][t.id], st = cellState(cell, S);
        return `<td><span class="hm-cell hm-cell--${st}" data-state="${st}" title="${esc(t.name)}: ${cell && cell.pct != null ? cell.pct + "%" : "pending"}">${st === "pending" ? "?" : cell && cell.pct != null ? cell.pct + "%" : "-"}</span></td>`; }).join("")}</tr>`).join("")}
      </tbody></table>
      <p class="hm-legend mono" style="margin-top:12px;font-size:13px"><span class="hm-cell hm-cell--green">75%+</span> got it <span class="hm-cell hm-cell--amber">${S.struggle}-74%</span> shaky <span class="hm-cell hm-cell--red">under ${S.struggle}%</span> re-teach</p></div>
    <div class="panel-box"><h3>What the 40% rule says</h3>
      <table class="tbl" id="rule-table"><thead><tr><th>Topic</th><th>Struggling</th><th>Decision</th></tr></thead><tbody>
      ${decisions.map((d) => `<tr data-topic="${d.topicId}"><td>${esc(d.name)}</td><td class="mono">${d.assessed ? `${d.struggling.length} of ${d.assessed} (${d.share}%)` : "-"}</td><td><span class="st ${d.action === "reteach" ? "st--bad" : d.action === "homework" ? "st--warn" : "st--ok"}">${ACTION_TEXT[d.action]}</span></td></tr>`).join("")}
      </tbody></table></div>
    ${rt.length ? replanHtml(rt, target) : '<div class="panel-box"><p>No topic reaches the class re-teach line. Personal homework covers each learner.</p></div>'}
    <div class="btn-row"><button class="btn btn--accent" id="to-hw" type="button">Personal homework</button></div>`;
  const $ = (s) => root.querySelector(s);
  $("#to-hw").onclick = () => ctx.go("homework");
  root.querySelectorAll("[data-replan]").forEach((b) => b.onclick = () => replan(root, ctx, b.dataset.replan, decisions));
}

function replanHtml(rt, target) {
  if (!state.plan) return `<div class="panel-box"><p class="notice notice--bad">Plan the term first so Chommie can re-plan.</p></div>`;
  return `<div class="panel-box" id="replan"><h3>Re-plan proposed by the Coordinator</h3>
    ${rt.map((d) => { const done = state.plan.reteaches.find((r) => r.topicId === d.topicId);
      const pre = !done && target ? addReteach(state.plan, { topicId: d.topicId, topicName: d.name, minutes: 15, fromDate: target.date }) : null;
      return `<div data-replan-row="${d.topicId}" style="padding:12px 0;border-top:1px solid var(--line)">
        <p><strong>${esc(d.name)}</strong>: ${d.struggling.length} of ${d.assessed} learners struggling (${d.share}%).</p>
        ${done ? `<p class="st st--ok">Re-teach already added on ${fmt(done.date)}.</p>`
          : pre && pre.ok ? `<p>Add a <strong>15 minute</strong> re-teach to <strong>${fmt(pre.placedOn)}</strong>. Every ATP topic stays, and the test on ${fmt(state.plan.term.test)} is still met.</p>
             ${pre.warnings.map((w) => `<p class="notice notice--bad" role="alert">${esc(w)}</p>`).join("")}
             <div class="btn-row"><button class="btn btn--accent" data-replan="${d.topicId}" type="button" ${busy ? "disabled" : ""}>Re-plan and rewrite that lesson</button></div>${busy ? `<p class="loading" role="status">${esc(busy)}</p>` : ""}`
          : `<p class="notice notice--bad" role="alert">${esc(pre ? pre.warnings[0] : "No lesson day left to add it to.")}</p>`}
      </div>`; }).join("")}</div>`;
}

async function replan(root, ctx, topicId, decisions) {
  const d = decisions.find((x) => x.topicId === topicId), target = nextLessonDay(state.plan, state.today);
  const r = addReteach(state.plan, { topicId, topicName: d.name, minutes: 15, fromDate: target.date });
  if (!r.ok) { toast(r.warnings[0]); return; }
  state.plan = r.plan; delete state.lessons[r.placedOn];
  log("Analyst", "Class re-teach triggered", `${d.name}: ${d.struggling.length} of ${d.assessed} struggling (${d.share}% is at or above ${state.settings.reteach}%)`);
  log("Coordinator", "Re-planned", `Added 15 minute re-teach of ${d.name} to ${fmt(r.placedOn)}. All ATP topics kept, test ${fmt(state.plan.term.test)} and exam ${fmt(state.plan.term.exam)} still met. ${r.warnings.join(" ")}`);
  save();
  busy = "Lesson Writer is rewriting " + fmt(r.placedOn); draw(root, ctx);
  try { const day = state.plan.days.find((x) => x.date === r.placedOn); if (day.kind === "lesson") await generateLesson(day, "Rewrote lesson with the re-teach"); } catch (e) { toast(e.message); }
  busy = ""; focus(r.placedOn); ctx.go("teach");
}
