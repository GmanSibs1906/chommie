import test from "node:test"; import assert from "node:assert/strict";
import { resolveItem, finalCorrect, scoreLearner, topicPercents } from "../shared/marking.js";
import { checkTask } from "../shared/assessment.js";
const a = (read, correct, conf = 0.95, legible = true) => ({ read, correct, confidence: conf, legible });
test("memo for the check is computed by code", () => { const t = checkTask(); assert.deepEqual(t.questions.map(q => q.answer), ["3/6", "6/8", "5/7", "1/3", "3/4", "5/6", "3 3/4", "3 2/3", "9", "4"]); });
test("agree", () => assert.deepEqual(resolveItem("5/6", a("5/6", true), a("5/6", true)), { status: "agree", correct: true }));
test("equivalent value counts as correct", () => assert.equal(resolveItem("1/3", a("3/9", true), a("3/9", true)).status, "agree"));
test("disagreement goes to the teacher, nothing is scored", () => { const r = resolveItem("5/6", a("5/6", true), a("3/9", false)); assert.equal(r.status, "disagree"); assert.equal(finalCorrect({ ...r }), null); });
test("unclear handwriting is never guessed", () => { const r = resolveItem("6/8", a("?/8", false, 0.4, false), a("6/8", true)); assert.equal(r.status, "unclear"); assert.equal(finalCorrect(r), null); });
test("low confidence is unclear even if legible", () => assert.equal(resolveItem("9", a("9", true, 0.7), a("9", true)).status, "unclear"));
test("code catches a marker whose mark contradicts its own reading (send back)", () => { const r = resolveItem("5/6", a("3/9", true), a("3/9", false)); assert.equal(r.status, "disagree"); const s = resolveItem("5/6", a("3/9", true), a("3/9", true)); assert.equal(s.status, "sendback"); assert.deepEqual(s.who, ["A", "B"]); });
test("teacher decision wins and scoring counts it", () => {
  const items = [{ n: 1, status: "disagree", decision: { correct: true } }, { n: 2, status: "agree", correct: false }, { n: 3, status: "unclear" }];
  assert.deepEqual(scoreLearner(items), { right: 1, scored: 2, total: 3, pending: 1 });
});
test("topic percent", () => { const t = checkTask(); const items = t.questions.map(q => ({ n: q.n, status: "agree", correct: q.n !== 5 && q.n !== 6 })); const p = topicPercents(items, t.questions); assert.equal(p.related.pct, 0); assert.equal(p.equiv.pct, 100); });
