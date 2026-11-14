// Analyst: plain code. Heat map and the 40% rule. Thresholds come from Settings.
import { finalCorrect } from "./marking.js";
import { TOPICS } from "./assessment.js";
import { questionsFor } from "./hwmark.js";

export const GREEN_MIN = 75;
export function cellState(cell, settings) {
  if (!cell) return "none";
  if (cell.pending) return "pending";
  if (cell.pct < settings.struggle) return "red";
  return cell.pct < Math.max(GREEN_MIN, settings.struggle + 1) ? "amber" : "green";
}

// marks: { taskId: { code: { items } } }, tasks: [{id, questions}] -> { code: { topicId: {right, of, pending, pct} } }
export function buildHeat(marks, tasks) {
  const out = {};
  for (const t of tasks) for (const [code, m] of Object.entries(marks[t.id] || {})) {
    const row = (out[code] ||= {});
    for (const q of questionsFor(t, code)) {
      const it = m.items.find((i) => i.n === q.n); const c = (row[q.topicId] ||= { right: 0, of: 0, pending: 0 });
      const f = it ? finalCorrect(it) : null;
      if (f === null) c.pending++; else { c.of++; if (f) c.right++; }
    }
  }
  for (const row of Object.values(out)) for (const c of Object.values(row)) c.pct = c.of ? Math.round((100 * c.right) / c.of) : null;
  return out;
}

// The 40% rule, per topic. Only learners with a fully scored cell for that topic count.
export function topicDecisions(heat, settings) {
  return TOPICS.map((t) => {
    const cells = Object.entries(heat).map(([code, row]) => [code, row[t.id]]).filter(([, c]) => c && !c.pending && c.of > 0);
    const struggling = cells.filter(([, c]) => c.pct < settings.struggle).map(([code]) => code);
    const share = cells.length ? Math.round((100 * struggling.length) / cells.length) : 0;
    return { topicId: t.id, name: t.name, assessed: cells.length, struggling, share,
      action: !cells.length ? "none" : share >= settings.reteach ? "reteach" : struggling.length ? "homework" : "ok" };
  });
}
export const ACTION_TEXT = { reteach: "Class re-teach", homework: "Personal homework only", ok: "No action", none: "Not assessed yet" };
