// Term Planner: plain code, no model. Dates are "YYYY-MM-DD" strings, computed in UTC so no timezone drift.
export const TERM4_2026 = {
  name: "Term 4 2026", start: "2026-10-06", end: "2026-12-09",
  holidays: [], // none between 6 Oct and 9 Dec 2026 (next public holiday is 16 Dec)
  test: "2026-11-26", exam: "2026-12-02",
  lessonMin: 60, minRevisionMin: 60, warnRevisionMin: 120,
};
const D = (s) => new Date(s + "T00:00:00Z");
export const ymd = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => ymd(new Date(D(s).getTime() + n * 86400000));
export const dow = (s) => D(s).getUTCDay(); // 0 Sun
const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const fmt = (s) => `${DN[dow(s)]} ${D(s).getUTCDate()} ${MN[D(s).getUTCMonth()]}`;
export const mondayOf = (s) => addDays(s, -((dow(s) + 6) % 7));

export function schoolDays(term = TERM4_2026) {
  const out = [];
  for (let d = term.start; d <= term.end; d = addDays(d, 1)) if (dow(d) >= 1 && dow(d) <= 5 && !term.holidays.includes(d)) out.push(d);
  return out;
}

const day = (date, kind, extra = {}) => ({ date, kind, blocks: [], ...extra });

export function buildPlan(check, term = TERM4_2026) {
  const warnings = [];
  const days = schoolDays(term).map((d) => day(d, "buffer", { label: "Marking, reports, end of term" }));
  const byDate = Object.fromEntries(days.map((x) => [x.date, x]));
  const wk1 = mondayOf(term.start);
  const weekDays = (w) => days.filter((x) => x.date >= addDays(wk1, 7 * (w - 1)) && x.date < addDays(wk1, 7 * w));
  const test = byDate[term.test], exam = byDate[term.exam];
  if (!test || !exam) warnings.push("The test or exam date is not a school day in this term.");
  // 1. teaching rows (only topics found in the ATP and in CAPS)
  for (const r of check.rows.filter((r) => r.status === "matched")) {
    for (let w = r.from; w <= r.to; w++) for (const x of weekDays(w)) {
      if (x.date >= term.test) { warnings.push(`${r.capsName} runs into the test date (${fmt(term.test)}).`); continue; }
      Object.assign(x, { kind: "lesson", topicId: r.capsId, topic: r.capsName, atpTopic: r.topic, atpWeek: w, label: r.capsName,
        blocks: [{ type: "new", topicId: r.capsId, minutes: term.lessonMin, label: r.capsName }] });
    }
  }
  // 2. everything else before the test is revision; then test, feedback, exam revision, exam, buffer
  for (const x of days) {
    if (x.kind === "lesson") continue;
    if (x.date < term.test) Object.assign(x, { kind: "revision", label: "Revision", atpWeek: 8, blocks: [{ type: "revise", minutes: term.lessonMin, label: "Revision" }] });
    else if (x.date === term.test) Object.assign(x, { kind: "test", label: "Test", atpWeek: 8 });
    else if (x.date < term.exam) Object.assign(x, { kind: x.date === addDays(term.test, 1) && dow(x.date) === 5 ? "feedback" : "revision", label: x.date === addDays(term.test, 1) ? "Test feedback" : "Exam revision", atpWeek: 9,
      blocks: x.date === addDays(term.test, 1) ? [] : [{ type: "revise", minutes: term.lessonMin, label: "Exam revision" }] });
    else if (x.date === term.exam) Object.assign(x, { kind: "exam", label: "Exam", atpWeek: 9 });
  }
  for (const m of check.missing || []) warnings.push(`Required CAPS topic missing from the ATP, so it is not planned: ${m.name}.`);
  const plan = { term, days, warnings, reteaches: [] };
  plan.warnings.push(...revisionWarning(plan));
  return plan;
}

const preTest = (plan) => plan.days.filter((x) => x.date < plan.term.test);
export function revisionMinutesLeft(plan) {
  return preTest(plan).filter((x) => x.kind === "revision").reduce((s, x) => s + x.blocks.filter((b) => b.type === "revise").reduce((a, b) => a + b.minutes, 0), 0);
}
function revisionWarning(plan) {
  const left = revisionMinutesLeft(plan);
  return left < plan.term.warnRevisionMin ? [`Time is short: only ${left} minutes of revision are left before the test on ${fmt(plan.term.test)}.`] : [];
}

// Adds a short class re-teach to the first lesson (or revision) day on/after fromDate and before the test.
// Pays for it from the revision pool. Never removes a topic. Refuses (and changes nothing) if the pool would drop below the minimum.
export function addReteach(plan, { topicId, topicName, minutes = 15, fromDate }) {
  const p = structuredClone(plan), term = p.term;
  const left = revisionMinutesLeft(p);
  if (left - minutes < term.minRevisionMin)
    return { ok: false, plan, placedOn: null, warnings: [`Not enough time: a ${minutes} minute re-teach would leave ${left - minutes} minutes of revision before the test on ${fmt(term.test)} (minimum ${term.minRevisionMin}). Shorten it, or ask your HOD to move the test.`] };
  const target = p.days.find((x) => x.date >= fromDate && x.date < term.test && (x.kind === "lesson" || x.kind === "revision"));
  if (!target) return { ok: false, plan, placedOn: null, warnings: ["There is no lesson day left before the test to add a re-teach to."] };
  target.blocks.unshift({ type: "reteach", topicId, minutes, label: `Re-teach: ${topicName}` });
  if (target.kind === "lesson") {
    const nw = target.blocks.find((b) => b.type === "new");
    nw.minutes -= minutes; nw.trimmed = (nw.trimmed || 0) + minutes;
    // the trimmed minutes move to the first revision day with room, as a catch-up block
    const rev = p.days.find((x) => x.kind === "revision" && x.date > target.date && x.date < term.test && x.blocks.some((b) => b.type === "revise" && b.minutes - minutes >= 0));
    const rb = rev.blocks.find((b) => b.type === "revise"); rb.minutes -= minutes;
    rev.blocks.push({ type: "catchup", topicId: target.topicId, minutes, label: `Catch-up: ${target.topic}` });
  } else {
    const rb = target.blocks.find((b) => b.type === "revise"); rb.minutes -= minutes;
  }
  p.reteaches.push({ topicId, minutes, date: target.date });
  p.warnings = p.warnings.filter((w) => !w.startsWith("Time is short")).concat(revisionWarning(p));
  return { ok: true, plan: p, placedOn: target.date, warnings: revisionWarning(p) };
}

// Independent check used by the Reviewer and by tests.
export function verifyPlan(plan, check) {
  const problems = [], term = plan.term, ok = new Set(schoolDays(term));
  for (const x of plan.days) if (!ok.has(x.date)) problems.push("Not a school day: " + x.date);
  for (const c of check.rows.filter((r) => r.status === "matched")) {
    const ds = plan.days.filter((x) => x.kind === "lesson" && x.topicId === c.capsId);
    if (!ds.length) problems.push("Topic dropped: " + c.capsName);
    else if (ds.some((x) => x.date >= term.test)) problems.push("Topic after test: " + c.capsName);
    else if (!ds.some((x) => x.blocks.some((b) => b.type === "new" && b.minutes > 0))) problems.push("Topic has no teaching time: " + c.capsName);
  }
  if (plan.days.find((x) => x.date === term.test)?.kind !== "test") problems.push("Test date not marked");
  if (plan.days.find((x) => x.date === term.exam)?.kind !== "exam") problems.push("Exam date not marked");
  if (revisionMinutesLeft(plan) < term.minRevisionMin) problems.push("Less than the minimum revision time before the test");
  return problems;
}
