import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkOfficial, termCalendar, slug } from "../shared/atp.js";
import { buildPlanByHours, verifyPlan, schoolDays } from "../shared/planner.js";
import { pdfPages, termSection, capText } from "../netlify/lib/pdftext.mjs";

const ATP = { weeks: [
  { from: 1, to: 1, topic: "Mass", hours: 9, kind: "teach" }, { from: 2, to: 2, topic: "Time", hours: 6, kind: "teach" },
  { from: 3, to: 3, topic: "Capacity and volume", hours: 6, kind: "teach" }, { from: 4, to: 5, topic: "Data handling", hours: 12, kind: "teach" },
  { from: 6, to: 6, topic: "Use all four basic operations to solve problems in context", hours: 6, kind: "teach" },
  { from: 7, to: 7, topic: "Revision", hours: 6, kind: "revision" }, { from: 8, to: 8, topic: "Formal assessment task", hours: 3, kind: "test" }],
  assessments: [{ name: "Formal assessment task", week: 8, kind: "task" }] };

test("the real fixture PDF gives the real Term 4 text and nothing from other terms", async () => {
  const pages = await pdfPages(new Uint8Array(fs.readFileSync("tests/fixtures/grade-6-maths-atp-caps.pdf")));
  assert.equal(pages.length, 5);
  const t4 = capText(termSection(pages, 4));
  for (const w of ["MASS", "TIME", "CAPACITY AND VOLUME", "DATA HANDLING", "12 hrs", "(TERM 4)"]) assert.ok(t4.includes(w), "Term 4 text has " + w);
  assert.ok(!/Equivalent fractions/i.test(t4), "no built-in fractions data");
  const t3 = capText(termSection(pages, 3));
  assert.ok(!t3.includes("(TERM 4)"));
});
test("checkOfficial accepts every teaching row and treats revision/test as assessment", () => {
  const c = checkOfficial(ATP);
  assert.equal(c.rows.filter((r) => r.status === "matched").length, 5);
  assert.equal(c.rows.filter((r) => r.status === "assessment").length, 2);
  assert.equal(c.missing.length, 0);
  assert.equal(slug("Capacity and volume"), "capacity-and-volume");
  const dup = checkOfficial({ weeks: [{ topic: "Data", kind: "teach" }, { topic: "Data", kind: "teach" }] });
  assert.notEqual(dup.rows[0].capsId, dup.rows[1].capsId);
});
test("termCalendar: 2026 dates, test and exam on school days, test before exam", () => {
  const t4 = termCalendar(4, ATP);
  assert.equal(t4.start, "2026-10-06"); assert.equal(t4.test, "2026-11-26"); assert.equal(t4.exam, "2026-12-02");
  for (const n of [1, 2, 3, 4]) {
    const t = termCalendar(n, {}), days = schoolDays(t);
    assert.ok(days.includes(t.test) && days.includes(t.exam) && t.test < t.exam, "term " + n);
  }
  assert.ok(!schoolDays(termCalendar(2, {})).includes("2026-06-16"), "Youth Day is not a school day");
});
test("buildPlanByHours places every topic, in proportion to hours, before the test", () => {
  for (const n of [1, 2, 3, 4]) {
    const c = checkOfficial(ATP), term = termCalendar(n, ATP), p = buildPlanByHours(c, term);
    assert.deepEqual(verifyPlan(p, c), [], "term " + n);
    const lessons = (id) => p.days.filter((d) => d.kind === "lesson" && d.topicId === id).length;
    assert.ok(lessons("data-handling") > lessons("time"), "12 hours gets more days than 6");
    assert.ok(p.days.every((d) => d.kind !== "lesson" || d.date < term.test));
  }
});
test("buildPlanByHours warns when there are more topics than days", () => {
  const many = { weeks: Array.from({ length: 60 }, (_, i) => ({ from: 1, to: 1, topic: "Topic " + i, hours: 1, kind: "teach" })) };
  const p = buildPlanByHours(checkOfficial(many), termCalendar(4, many));
  assert.ok(p.warnings.some((w) => /short/i.test(w)));
});
import { fillWeeks } from "../shared/atp.js";
test("fillWeeks works weeks out from hours when the document does not show them", () => {
  const a = fillWeeks({ weeks: [{ from: 0, to: 0, topic: "Mass", hours: 9 }, { from: 0, to: 0, topic: "Time", hours: 6 }, { from: 0, to: 0, topic: "Cap", hours: 6 }, { from: 0, to: 0, topic: "Data", hours: 12 }, { from: 0, to: 0, topic: "Rev", hours: 6 }] });
  assert.deepEqual(a.weeks.map((w) => [w.from, w.to]), [[1, 2], [3, 3], [4, 4], [5, 6], [7, 7]]);
  const keep = fillWeeks({ weeks: [{ from: 2, to: 3, topic: "X", hours: 6 }] });
  assert.deepEqual([keep.weeks[0].from, keep.weeks[0].to], [2, 3]);
});
