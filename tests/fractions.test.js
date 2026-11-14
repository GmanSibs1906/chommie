import test from "node:test"; import assert from "node:assert/strict";
import { evalExpr, fmtFrac, sameValue, pretty } from "../shared/fractions.js";
import { proveLesson } from "../shared/lesson.js";
const v = (e) => fmtFrac(evalExpr(e));
test("fraction arithmetic", () => {
  assert.equal(v("2/3 + 1/6"), "5/6"); assert.equal(v("5/8 - 1/4"), "3/8"); assert.equal(v("3/4 of 12"), "9");
  assert.equal(v("1 1/2 + 2/3"), "2 1/6"); assert.equal(v("0.75 + 1/4"), "1"); assert.equal(v("1/2 + 1/4"), "3/4");
});
test("bad input is rejected, not guessed", () => { assert.throws(() => evalExpr("two thirds")); assert.throws(() => evalExpr("1/0")); });
test("equal values", () => { assert.ok(sameValue("2/4", "1/2")); assert.ok(!sameValue("2/5", "1/2")); });
test("pretty uses unicode fractions", () => assert.equal(pretty("2/3 + 1/6"), "⅔ + ⅙"));
test("memo is proven by code and a wrong model answer is corrected", () => {
  const L = proveLesson({ outline: [{ step: "x", minutes: 5 }], examples: [{ kind: "calc", expr: "2/3 + 1/6", answer: "3/9" }], classWork: [{ kind: "equiv", from: "3/4", toDen: 8 }, { kind: "equiv", from: "2/3", toDen: 7 }], homework: [{ kind: "text", q: "Explain", answer: "x" }] });
  assert.equal(L.examples[0].answer, "5/6"); assert.equal(L.examples[0].corrected, "3/9"); assert.equal(L.classWork[0].answer, "6/8");
  assert.ok(L.classWork[1].error); assert.equal(L.classWork[1].proven, false); assert.equal(L.unproven, 2);
});
test("simplify items are proven", () => { const L = proveLesson({ examples: [{ kind: "simplify", from: "18/24" }] }); assert.equal(L.examples[0].answer, "3/4"); assert.ok(L.examples[0].proven); });
import { codeLesson, shortenLesson } from "../shared/lessonfallback.js";
test("fallback lesson is fully proven, re-teach goes first and the outline still adds up to 60", () => {
  const L = codeLesson({ topic: "Fractions and decimals", topicId: "decimals", atpWeek: 7, date: "2026-11-16", reteach: { topic: "Related denominators", minutes: 15 } });
  assert.equal(L.unproven, 0); assert.match(L.outline[0].step, /Class re-teach/); assert.equal(L.outline.reduce((s, o) => s + o.minutes, 0), 60);
  const S = shortenLesson(L); assert.ok(S.classWork.length <= 3 && S.outline.reduce((s, o) => s + o.minutes, 0) < 60);
});
