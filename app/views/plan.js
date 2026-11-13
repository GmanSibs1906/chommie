import { state, save, log, toast, esc } from "../state.js";
import { checkAgainstCaps } from "../../shared/caps.js";
import { buildPlan, verifyPlan, revisionMinutesLeft, fmt, addDays, mondayOf, TERM4_2026 } from "../../shared/planner.js";

export async function render(root, ctx) {
  if (!state.atp || !state.check) {
    root.innerHTML = `<h1 class="v-title">Plan the term</h1><p class="v-lede">Upload your ATP first. Chommie places every topic on a real school day.</p>
      <button class="btn btn--accent" id="to-up" type="button">Upload ATP</button>`;
    root.querySelector("#to-up").onclick = () => ctx.go("upload"); return;
  }
  if (!state.plan) { state.plan = buildPlan(state.check); log("Term Planner", "Planned the term", `${state.plan.days.filter((d) => d.kind === "lesson").length} lesson days placed, test ${fmt(TERM4_2026.test)}, exam ${fmt(TERM4_2026.exam)}`); save(); }
  draw(root, ctx);
}

function draw(root, ctx) {
  const p = state.plan, problems = verifyPlan(p, state.check), t = p.term;
  const wk1 = mondayOf(t.start), weeks = [];
  for (let m = wk1; m <= t.end; m = addDays(m, 7)) weeks.push(m);
  const daysLeft = p.days.filter((d) => d.date >= state.today && d.date < t.test).length;
  root.innerHTML = `
    <h1 class="v-title">Your term, on real school days.</h1>
    <p class="v-lede">Every topic from your ATP is placed on a school day, worked back from the test on <strong>${fmt(t.test)}</strong> and the exam on <strong>${fmt(t.exam)}</strong>.</p>
    <div class="grid2">
      <div class="panel-box"><h3>Checks</h3>
        <ul class="checks-list" id="plan-checks">
          <li><span class="st ${problems.length ? "st--bad" : "st--ok"}">${problems.length ? "Problems found" : "Passed"}</span> ${problems.length ? esc(problems.join("; ")) : "Every required ATP topic is placed, all before the test."}</li>
          <li>Test: <strong>${fmt(t.test)}</strong>. Exam: <strong>${fmt(t.exam)}</strong>.</li>
          <li>Revision time left before the test: <strong id="rev-left">${revisionMinutesLeft(p)} minutes</strong> (minimum ${t.minRevisionMin}). Lesson days left before the test: ${daysLeft}.</li>
        </ul>
        ${p.warnings.map((w) => `<p class="notice notice--bad" style="margin-top:10px" role="alert">${esc(w)}</p>`).join("")}
      </div>
      <div class="panel-box"><h3>Where are you in the term?</h3>
        <div class="field-inline"><label for="today">Today</label><input type="date" id="today" value="${state.today}" min="${t.start}" max="${t.end}" /></div>
        <p class="muted" style="font-size:14px;margin-top:8px">Re-planning starts from the next school day after this date.</p>
        <div class="btn-row">
          ${state.planApproved ? `<span class="st st--ok">Plan approved by you</span><button class="btn btn--accent" id="go-teach" type="button">Open today's lesson</button>`
            : `<button class="btn btn--accent" id="approve-plan" type="button">Approve this plan</button>`}
        </div>
      </div>
    </div>
    <div id="calendar">${weeks.map((m, i) => `<div class="cal-week"><h4>Week ${i + 1}, from ${fmt(m)}</h4><div class="cal-days">
      ${p.days.filter((d) => d.date >= m && d.date < addDays(m, 7)).map((d) => `<div class="cal-day cal-day--${d.kind}${d.date === state.today ? " is-today" : ""}" data-date="${d.date}">
        <span class="d">${fmt(d.date)}</span><span class="t">${esc(d.label || "")}${d.kind === "lesson" ? "" : ""}
        ${d.blocks.filter((b) => b.type === "reteach" || b.type === "catchup").map((b) => `<span class="rt">${esc(b.label)}, ${b.minutes} min</span>`).join("")}</span></div>`).join("")}
    </div></div>`).join("")}</div>`;
  root.querySelector("#today").onchange = (e) => { state.today = e.target.value; save(); draw(root, ctx); };
  const ap = root.querySelector("#approve-plan");
  if (ap) ap.onclick = () => { state.planApproved = true; log("Teacher", "Approved term plan", "Teacher approved the term plan"); save(); toast("Plan approved"); draw(root, ctx); };
  const gt = root.querySelector("#go-teach"); if (gt) gt.onclick = () => ctx.go("teach");
}
