import test from "node:test"; import assert from "node:assert/strict";
import jsQR from "../shared/vendor/jsqr.mjs";
import { codeBank, proveBank, buildHomework } from "../shared/homework.js";
import { checkTask } from "../shared/assessment.js";
import { buildHeat } from "../shared/analyst.js";
import { resolveItem, finalCorrect } from "../shared/marking.js";
import { snapshot, sheetId, qrPayload, parseQr, qrRgba, matchSheet, questionsFor, hwTask, sheetQuestions } from "../shared/hwmark.js";

const S = { struggle: 50, reteach: 40 }, task = checkTask(), bank = proveBank(codeBank("t"));
const W = { "6B-001": [1, 2, 5, 6, 7], "6B-002": [5, 8], "6B-003": [3] };
const marks = { [task.id]: Object.fromEntries(Object.entries(W).map(([c, w]) => [c, { items: task.questions.map((q) => ({ n: q.n, status: "agree", correct: !w.includes(q.n) })) }])) };
const hw = buildHomework({ marks, tasks: [task], bank, settings: S });
const sheets = {}; for (const c of Object.keys(hw)) { const sn = snapshot({ ...hw[c], code: c }, 1); sheets[sn.id] = sn; }
const sheetOf = (c) => Object.values(sheets).find((s) => s.code === c);

test("QR payload has the code and sheet id and no learner name", () => {
  const sn = sheetOf("6B-001"), p = qrPayload("6B-001", sn.id);
  assert.match(p, /^CHOMMIE-HW\|6B-001\|R1-6B-001-[0-9A-Z]{4}$/);
  assert.deepEqual(parseQr(p), { code: "6B-001", id: sn.id });
  assert.equal(parseQr("https://example.com"), null);
  assert.equal(parseQr("CHOMMIE-HW|6B-001|Thandi Mokoena"), null);
});
test("the printed QR really decodes back to code and sheet id", () => {
  const sn = sheetOf("6B-002"), img = qrRgba(qrPayload("6B-002", sn.id), 5);
  const r = jsQR(img.data, img.width, img.height);
  assert.ok(r, "QR decoded"); assert.deepEqual(parseQr(r.data), { code: "6B-002", id: sn.id });
});
test("an edited sheet gets a new id", () => {
  const a = hw["6B-001"], b = { ...a, items: a.items.slice(1) };
  assert.notEqual(sheetId(a, 1), sheetId(b, 1));
});
test("sheet questions are the learner's own, numbered, with a proven memo", () => {
  const q = sheetOf("6B-001").questions; assert.ok(q.length >= 5);
  assert.deepEqual(q.map((x) => x.n), q.map((_, i) => i + 1)); assert.ok(q.every((x) => x.answer && x.plain && x.topicId));
});

const qr = (c) => { const s = sheetOf(c); return { code: s.code, id: s.id }; };
test("right learner: QR matches the picked learner, marked against that learner's sheet", () => {
  const m = matchSheet({ picked: "6B-001", qrs: [qr("6B-001"), null], sheets });
  assert.ok(m.ok); assert.equal(m.via, "qr"); assert.equal(m.sheet.id, sheetOf("6B-001").id);
});
test("wrong code: page says 6B-002 but 6B-001 was picked -> Check, not marked", () => {
  const m = matchSheet({ picked: "6B-001", qrs: [qr("6B-002")], sheets });
  assert.equal(m.ok, false); assert.match(m.reason, /does not match/); assert.equal(m.claimed, "6B-002");
});
test("learner with no approved sheet -> Check", () => {
  const m = matchSheet({ picked: "6B-009", qrs: [], printed: { code: "6B-009", id: "R1-6B-009-AAAA" }, sheets });
  assert.equal(m.ok, false); assert.match(m.reason, /no approved homework sheet/);
});
test("QR for a sheet this phone never approved -> Check", () => {
  const m = matchSheet({ picked: "6B-001", qrs: [{ code: "6B-001", id: "R9-6B-001-ZZZZ" }], sheets });
  assert.equal(m.ok, false); assert.match(m.reason, /not an approved sheet/);
});
test("pages carrying two different sheets -> Check", () => {
  assert.equal(matchSheet({ picked: "6B-001", qrs: [qr("6B-001"), qr("6B-002")], sheets }).ok, false);
});
test("no QR: Marker A's printed code is checked the same way", () => {
  const good = matchSheet({ picked: "6B-003", qrs: [null], printed: qr("6B-003"), sheets });
  assert.ok(good.ok); assert.equal(good.via, "printed");
  assert.equal(matchSheet({ picked: "6B-003", qrs: [null], printed: qr("6B-001"), sheets }).ok, false);
  assert.equal(matchSheet({ picked: "6B-003", qrs: [null], printed: null, sheets }).ok, false);
  assert.equal(matchSheet({ picked: "6B-003", qrs: [null], printed: { code: "6B-003", id: "" }, sheets }).ok, false, "an unreadable id is never guessed");
});

// the same written answers, two different sheets -> different marks, because each learner's own memo is used
const a = (read, correct) => ({ read, legible: true, confidence: 0.95, correct });
test("per-learner memo: the same answers are marked against each learner's own sheet", () => {
  const q1 = sheetOf("6B-001").questions, q2 = sheetOf("6B-002").questions;
  assert.notDeepEqual(q1.map((q) => q.answer), q2.map((q) => q.answer));
  const written = q1[0].answer;                       // what 6B-001 wrote for Q1
  assert.equal(resolveItem(q1[0].answer, a(written, true), a(written, true)).correct, true);
  const other = q2[0].answer === written ? "no" : written; // the same text against 6B-002's memo
  const r = resolveItem(q2[0].answer, a(other, false), a(other, false));
  assert.equal(r.correct, false);
});
test("homework results feed the heat map per topic, each learner against their own questions", () => {
  const t = hwTask(1), code = "6B-001", qs = sheetOf(code).questions;
  t.perLearner[code] = { sheetId: sheetOf(code).id, questions: qs };
  const items = qs.map((q, i) => ({ n: q.n, status: "agree", correct: i !== 0 }));
  const heat = buildHeat({ [t.id]: { [code]: { items } } }, [t]);
  assert.equal(heat[code][qs[0].topicId].pending, 0);
  assert.ok(heat[code][qs[0].topicId].pct < 100);
  assert.deepEqual(questionsFor(t, "6B-777"), []);
});
test("a wrong homework answer comes back as 'Try again' in the next round", () => {
  const t = hwTask(1), code = "6B-001", qs = sheetOf(code).questions;
  t.perLearner[code] = { sheetId: "x", questions: qs };
  const items = qs.map((q, i) => ({ n: q.n, status: "agree", correct: i !== 2 }));
  const next = buildHomework({ marks: { [t.id]: { [code]: { items } } }, tasks: [t], bank, settings: S });
  const retry = next[code].items.filter((i) => i.source === "retry");
  assert.equal(retry.length, 1); assert.equal(retry[0].answer, qs[2].answer);
});
