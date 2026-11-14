import test from "node:test"; import assert from "node:assert/strict";
import { codeBank, proveBank, buildHomework } from "../shared/homework.js";
import { checkTask } from "../shared/assessment.js";
const task = checkTask(), S = { struggle: 50, reteach: 40 };
const W = { "6B-001": [1, 2, 5, 6, 7], "6B-002": [5, 8], "6B-007": [] };
const marks = { [task.id]: Object.fromEntries(Object.entries(W).map(([c, w]) => [c, { items: task.questions.map(q => ({ n: q.n, status: "agree", correct: !w.includes(q.n) })) }])) };
const bank = proveBank(codeBank("t"));
test("code bank: every item is proven, 6 practice and 3 stretch per topic", () => { for (const t of ["equiv", "same", "related", "mixed", "ofwhole"]) { assert.equal(bank[t].practice.length, 6); assert.equal(bank[t].stretch.length, 3); assert.ok(bank[t].practice.every(i => i.proven && i.answer)); } });
const hw = buildHomework({ marks, tasks: [task], bank, settings: S });
test("homework targets exactly what the learner got wrong", () => {
  assert.deepEqual(hw["6B-001"].topics.sort(), ["equiv", "mixed", "related"]);
  assert.deepEqual(hw["6B-002"].topics.sort(), ["mixed", "related"]);
  assert.equal(hw["6B-001"].items.filter(i => i.source === "retry").length, 5);
  assert.ok(hw["6B-001"].items.every(i => i.proven && i.answer !== undefined));
});
test("a learner who is ahead gets stretch questions and no retries", () => { const s = hw["6B-007"]; assert.ok(s.stretch); assert.equal(s.items.filter(i => i.source === "retry").length, 0); assert.ok(s.items.filter(i => i.source === "stretch").length >= 3); });
test("a learner who is behind gets no stretch", () => assert.ok(!hw["6B-001"].items.some(i => i.source === "stretch")));
