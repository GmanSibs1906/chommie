// Resolves what two markers said. Plain code: the markers read and judge, code compares, flags and counts.
import { sameValue } from "./fractions.js";
export const CONF_MIN = 0.8;

export function judge(memoAnswer, a) {
  const read = String(a?.read ?? "").trim();
  const unclear = !a || a.legible === false || !(Number(a.confidence) >= CONF_MIN);
  const codeCorrect = read === "" ? false : sameValue(read, memoAnswer) ? true : /^[\d\s./]+$/.test(read) ? false : null;
  return { read, unclear, correct: !!a?.correct, conf: Number(a?.confidence) || 0, codeCorrect };
}

// status: agree | disagree | unclear | sendback
export function resolveItem(memoAnswer, A, B) {
  const a = judge(memoAnswer, A), b = judge(memoAnswer, B);
  if (a.unclear || b.unclear) return { status: "unclear", who: [a.unclear && "A", b.unclear && "B"].filter(Boolean) };
  if (a.correct !== b.correct) return { status: "disagree" };
  const bad = [];
  if (a.codeCorrect !== null && a.codeCorrect !== a.correct) bad.push("A");
  if (b.codeCorrect !== null && b.codeCorrect !== b.correct) bad.push("B");
  if (bad.length) return { status: "sendback", who: bad };
  return { status: "agree", correct: a.correct };
}

// the mark that counts: teacher's decision first, else the agreed mark, else not yet scored
export const finalCorrect = (it) => (it.decision ? it.decision.correct : it.status === "agree" ? it.correct : null);
export const needsTeacher = (it) => finalCorrect(it) === null;

export function scoreLearner(items) {
  const done = items.filter((i) => finalCorrect(i) !== null);
  return { right: done.filter((i) => finalCorrect(i)).length, scored: done.length, total: items.length, pending: items.length - done.length };
}
// topic % for one learner from resolved items; null topic when nothing is scored yet
export function topicPercents(items, questions) {
  const out = {};
  for (const q of questions) { const it = items.find((i) => i.n === q.n); const f = it ? finalCorrect(it) : null; if (f === null) continue; (out[q.topicId] ||= { right: 0, of: 0 }); out[q.topicId].of++; if (f) out[q.topicId].right++; }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { ...v, pct: Math.round((100 * v.right) / v.of) }]));
}
