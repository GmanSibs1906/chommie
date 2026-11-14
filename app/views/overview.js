import { state, esc } from "../state.js";
import { nextStep } from "../../shared/coordinator.js";
import { listPhotos } from "../db.js";
import { getTasks } from "../orchestrator.js";
import { fmt } from "../../shared/planner.js";

export async function render(root, ctx) {
  const cls = ctx.cls;
  let queued = 0; try { queued = new Set((await listPhotos()).filter((p) => p.status === "queued").map((p) => p.code)).size; } catch {}
  const n = nextStep(state, { queued }), task = getTasks()[0];
  const L = state.learners || [], marked = Object.keys(state.marks[task.id] || {}).length;
  const hwRounds = Object.keys(state.homework || {}).length;
  const t = state.plan?.term;
  const tiles = [
    ["atp", "ATP", state.atp ? `Term ${state.atp.term}, ${state.atp.weeks.length} rows` : "Choose the ATP"],
    ["plan", "Term plan", state.plan ? `Test ${fmt(t.test)}` : "Plan the term"],
    ["learners", "Learners", `${L.length} in this class`],
    ["markflow", "Mark", `${marked} of ${L.filter((l) => l.consent).length} books marked`],
    ["homework", "Homework", hwRounds ? "See each learner's rounds" : "Per learner"],
    ["heat", "Heat map", marked ? "Who is struggling" : "Needs marked books"],
    ["more", "More", "Lessons, check, settings"],
  ];
  root.innerHTML = `
    <h1 class="v-title">${esc(cls.name)}</h1>
    <p class="v-lede">Grade ${esc(cls.grade)}, ${esc(cls.subject)}${cls.demo ? ". Made-up demo class." : "."}</p>
    <div class="panel-box next-box"><p class="mono next-kicker">Your next step</p><h2 class="next-title" id="next-title">${esc(n.label)}</h2><p class="muted">${esc(n.reason)}</p>
      <button class="btn btn--accent btn--big" id="next-go" type="button">Do this now</button></div>
    <div class="tile-grid" id="tiles">${tiles.map(([v, a, b]) => `<button class="tile" type="button" data-v="${v}"><span class="tile-title">${a}</span><span class="tile-sub">${esc(b)}</span></button>`).join("")}</div>
    <div class="panel-box" id="class-stats"><h3>Class overview</h3>
      <dl class="stats"><div><dt>Learners</dt><dd id="st-learners">${L.length}</dd></div><div><dt>Consented</dt><dd>${L.filter((l) => l.consent).length}</dd></div><div><dt>Books marked</dt><dd id="st-marked">${marked}</dd></div>
      <div><dt>Test</dt><dd>${t ? fmt(t.test) : "Not planned"}</dd></div><div><dt>Exam</dt><dd>${t ? fmt(t.exam) : "Not planned"}</dd></div></dl></div>`;
  root.querySelector("#next-go").onclick = () => ctx.go(n.view === "homework" ? "hwwrite" : n.view);
  root.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => ctx.go(b.dataset.v));
}
