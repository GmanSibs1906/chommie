import { test } from "node:test";
import assert from "node:assert/strict";
import { collectFixes, fixCounts } from "../shared/fixes.js";

const task = { id: "t1", name: "Fractions check", questions: [{ n: 6, plain: "2/3 + 1/6", answer: "5/6" }, { n: 10, plain: "1/5 of 20", answer: "4" }, { n: 2, plain: "3/4 = ?/8", answer: "6/8" }] };

test("a Reviewer reading is a suggestion held for the teacher until the teacher decides", () => {
  const item = { n: 6, status: "disagree", A: { read: "5/6", correct: true }, B: { read: "5/8", correct: false }, reviewer: { read: "5/8", correct: false } };
  const st = { tasks: [task], marks: { t1: { "6B-002": { items: [item] } } } };
  let f = collectFixes(st, () => "Lerato");
  assert.equal(f.length, 1); assert.equal(f[0].kind, "held");
  assert.match(f[0].was, /Marker A read "5\/6" \(correct\), Marker B read "5\/8" \(wrong\)/);
  assert.match(f[0].now, /Reviewer agrees: "5\/8", so wrong\. Waiting for your decision/);
  assert.match(f[0].where, /Lerato · Q6/);
  item.decision = { correct: false };
  f = collectFixes(st, () => "Lerato");
  assert.equal(f[0].kind, "fixed"); assert.match(f[0].by, /confirmed by you/);
});

test("the teacher overruling a wrong Reviewer reading is recorded as the teacher's fix", () => {
  const item = { n: 6, status: "unclear", who: ["A"], A: { read: "5/8", unclear: true }, B: { read: "5/8", correct: false }, reviewer: { read: "5/6", correct: true }, decision: { correct: false } };
  const f = collectFixes({ tasks: [task], marks: { t1: { "6B-002": { items: [item] } } } });
  assert.equal(f[0].kind, "fixed"); assert.equal(f[0].by, "You, the teacher"); assert.match(f[0].now, /overruled the Reviewer/);
  assert.match(f[0].was, /Marker A read "5\/8" but was unsure/);
});

test("unclear handwriting is held, not guessed; a send-back that was fixed is listed as fixed", () => {
  const st = { tasks: [task], marks: { t1: { "6B-003": { items: [
    { n: 10, status: "unclear", A: { unclear: true }, B: { read: "4", correct: true } },
    { n: 2, status: "agree", correct: true, attempts: 1, A: { read: "6/8", correct: true }, B: { read: "6/8", correct: true } },
  ] } } } };
  const f = collectFixes(st);
  assert.deepEqual(fixCounts(f), { fixed: 1, held: 1 });
  assert.equal(f.find((x) => x.kind === "held").now, "Not guessed. Held for the teacher");
  assert.match(f.find((x) => x.kind === "fixed").now, /Sent back 1× and fixed/);
});

test("a wrong AI memo answer replaced by calculation is listed; a correct one is not", () => {
  const st = { lessons: { "2026-11-16": { topic: "Related denominators", lesson: { title: "Re-teach", examples: [{ q: "Work out: 2/3 + 1/6 =", answer: "5/6", corrected: "3/9" }, { q: "Work out: 1/2 + 1/4 =", answer: "3/4" }], classWork: [], homework: [] } } } };
  const f = collectFixes(st);
  assert.equal(f.length, 1);
  assert.equal(f[0].place, "Memo"); assert.equal(f[0].was, "AI wrote 3/9"); assert.equal(f[0].now, "Calculated: 5/6");
});

test("ATP topics not in CAPS and missing CAPS topics are held for the teacher", () => {
  const st = { check: { rows: [{ from: 3, to: 3, topic: "Algebra", status: "extra" }, { from: 1, to: 2, topic: "Equivalent fractions", status: "matched" }], missing: [{ name: "Mixed numbers" }] } };
  const f = collectFixes(st);
  assert.deepEqual(fixCounts(f), { fixed: 0, held: 2 });
});

test("an empty class has nothing to show and nothing is invented", () => {
  assert.deepEqual(collectFixes({}), []);
});
