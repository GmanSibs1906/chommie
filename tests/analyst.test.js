import test from "node:test"; import assert from "node:assert/strict";
import { buildHeat, topicDecisions, cellState } from "../shared/analyst.js";
import { checkTask } from "../shared/assessment.js";
const task = checkTask(), S = { struggle: 50, reteach: 40 };
// wrong question numbers per learner, from the design's heat map
const W = { a: [1, 2, 5, 6, 7], b: [5, 8], c: [9], d: [1, 5, 6, 7, 8, 9], e: [7], f: [3, 5, 6], g: [] };
const marks = { [task.id]: Object.fromEntries(Object.entries(W).map(([c, w]) => [c, { items: task.questions.map(q => ({ n: q.n, status: "agree", correct: !w.includes(q.n) })) }])) };
const heat = buildHeat(marks, [task]);
test("cell colours: red below 50, amber 50-74, green 75+", () => { assert.equal(cellState({ pct: 49 }, S), "red"); assert.equal(cellState({ pct: 50 }, S), "amber"); assert.equal(cellState({ pct: 100 }, S), "green"); assert.equal(cellState({ pending: 1 }, S), "pending"); });
test("related denominators: 3 of 7 struggling (43%) so a class re-teach", () => {
  const d = topicDecisions(heat, S).find(x => x.topicId === "related"); assert.equal(d.struggling.length, 3); assert.equal(d.share, 43); assert.equal(d.action, "reteach");
});
test("under 40% means personal homework only", () => { const d = topicDecisions(heat, S).find(x => x.topicId === "equiv"); assert.equal(d.action, "homework"); assert.ok(d.share < 40); });
test("teacher can change both thresholds", () => {
  assert.equal(topicDecisions(heat, { struggle: 50, reteach: 50 }).find(x => x.topicId === "related").action, "homework");
  assert.equal(topicDecisions(heat, { struggle: 50, reteach: 10 }).find(x => x.topicId === "equiv").action, "reteach");
});
test("pending (undecided) answers are not counted", () => {
  const m = structuredClone(marks); m[task.id].a.items[4].status = "unclear"; delete m[task.id].a.items[4].correct;
  const h = buildHeat(m, [task]); assert.equal(h.a.related.pending, 1); assert.equal(topicDecisions(h, S).find(x => x.topicId === "related").assessed, 6);
});
