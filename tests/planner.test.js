import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkAgainstCaps } from "../shared/caps.js";
import { buildPlan, addReteach, verifyPlan, revisionMinutesLeft, schoolDays, fmt } from "../shared/planner.js";
const caps = JSON.parse(readFileSync("shared/caps-g6-t4.json")), off = JSON.parse(readFileSync("shared/official-atp-g6-t4.json"));
const check = checkAgainstCaps(off, caps);
test("school days exclude weekends; term starts Tue 6 Oct", () => { const d = schoolDays(); assert.equal(fmt(d[0]), "Tue 6 Oct"); assert.ok(d.every(x => ![0, 6].includes(new Date(x + "T00:00:00Z").getUTCDay()))); });
test("every ATP topic is on a real day before the test; test and exam are marked", () => {
  const p = buildPlan(check); assert.deepEqual(verifyPlan(p, check), []);
  assert.equal(p.days.find(x => x.kind === "test").date, "2026-11-26"); assert.equal(p.days.find(x => x.kind === "exam").date, "2026-12-02");
  assert.equal(revisionMinutesLeft(p), 180);
});
test("re-teach goes into tomorrow's lesson, keeps all topics, finishes before the test", () => {
  const p = buildPlan(check), r = addReteach(p, { topicId: "related", topicName: "Related denominators", fromDate: "2026-10-14" });
  assert.ok(r.ok); assert.equal(r.placedOn, "2026-10-14");
  assert.deepEqual(verifyPlan(r.plan, check), []); assert.equal(revisionMinutesLeft(r.plan), 165);
  const day = r.plan.days.find(x => x.date === "2026-10-14"); assert.ok(day.blocks.some(b => b.type === "reteach"));
});
test("warns early when time is short, then refuses rather than dropping a topic", () => {
  let p = buildPlan(check), warned = false, refused = false;
  for (let i = 0; i < 12; i++) {
    const r = addReteach(p, { topicId: "equiv", topicName: "Equivalent fractions", fromDate: "2026-10-14" });
    if (!r.ok) { refused = true; assert.match(r.warnings[0], /Not enough time/); break; }
    p = r.plan; if (p.warnings.some(w => w.startsWith("Time is short"))) warned = true;
    assert.deepEqual(verifyPlan(p, check), []);
  }
  assert.ok(warned && refused); assert.ok(revisionMinutesLeft(p) >= 60);
});
test("topics missing from the ATP are warned about, not invented", () => {
  const c = checkAgainstCaps({ weeks: off.weeks.filter(w => !/Mixed/.test(w.topic)) }, caps); const p = buildPlan(c);
  assert.ok(p.warnings.some(w => /Mixed numbers/.test(w))); assert.ok(!p.days.some(x => x.topicId === "mixed"));
});
