import test from "node:test"; import assert from "node:assert/strict";
import { markSheet, toXls } from "../shared/export.js";
import { nextStep, loopSteps } from "../shared/coordinator.js";
import { checkTask } from "../shared/assessment.js";
const t = checkTask(); t.type = "formal";
const learners = [{ code: "6B-001", name: "Thandi Mokoena", consent: true }, { code: "6B-002", name: "Sipho Ndlovu", consent: true }, { code: "6B-009", name: "Zanele Mahlangu", consent: false }];
const items = (w) => t.questions.map(q => ({ n: q.n, status: "agree", correct: !w.includes(q.n) }));
const marks = { [t.id]: { "6B-001": { items: items([1, 2]) }, "6B-002": { items: items([]) } } };
test("export is blocked while learners have no mark (no blanks allowed)", () => { const s = markSheet({ tasks: [t], marks, learners }); assert.ok(s.blocked); assert.throws(() => toXls(s)); });
test("absent with valid reason is -1 and nothing is blank", () => {
  const s = markSheet({ tasks: [t], marks, learners, absentAsMinusOne: true }), { xml, filename } = toXls(s);
  assert.deepEqual(s.rows.map(r => r.cells[0]), [8, 10, -1]); assert.ok(!xml.includes('<Data ss:Type="Number"></Data>'));
  assert.match(filename, /_B\.xls$/); assert.ok(xml.includes("Mokoena"));
});
test("informal tasks are never exported", () => { const inf = { ...t, id: "i", type: "informal" }; assert.throws(() => toXls(markSheet({ tasks: [inf], marks, learners, absentAsMinusOne: true })), /No formal/); });
test("coordinator decides the next step from state", () => {
  const S = { settings: { struggle: 50, reteach: 40 }, today: "2026-11-13", tasks: [t], marks: {}, lessons: {}, homework: null, hod: {} };
  assert.equal(nextStep(S, {}).id, "upload");
  S.atp = {}; assert.equal(nextStep(S, {}).id, "approveAtp");
  S.atpApproved = true; S.plan = { days: [], reteaches: [], term: { test: "2026-11-26", exam: "2026-12-02" } }; S.planApproved = true; assert.equal(nextStep(S, { queued: 3 }).id, "mark");
});
