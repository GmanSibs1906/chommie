// The class task the demo marks: "Fractions check", 10 questions, 2 per fractions topic. Memo is computed by code.
import { proveItem } from "./lesson.js";
export const TOPICS = [
  { id: "equiv", short: "Eq", name: "Equivalent fractions" }, { id: "same", short: "Sd", name: "Same denominators" },
  { id: "related", short: "Rd", name: "Related denominators" }, { id: "mixed", short: "Mx", name: "Mixed numbers" }, { id: "ofwhole", short: "Wn", name: "Fractions of whole numbers" },
];
const RAW = [
  [{ kind: "equiv", from: "1/2", toDen: 6 }, "equiv"], [{ kind: "equiv", from: "3/4", toDen: 8 }, "equiv"],
  [{ kind: "calc", expr: "2/7 + 3/7" }, "same"], [{ kind: "calc", expr: "5/9 - 2/9" }, "same"],
  [{ kind: "calc", expr: "1/2 + 1/4" }, "related"], [{ kind: "calc", expr: "2/3 + 1/6" }, "related"],
  [{ kind: "calc", expr: "1 1/2 + 2 1/4" }, "mixed"], [{ kind: "calc", expr: "2 1/3 + 1 1/3" }, "mixed"],
  [{ kind: "calc", expr: "3/4 of 12" }, "ofwhole"], [{ kind: "calc", expr: "1/5 of 20" }, "ofwhole"],
];
export function checkTask() {
  return { id: "check-2026-11-13", name: "Fractions check", date: "2026-11-13", type: "informal", total: RAW.length,
    questions: RAW.map(([it, topicId], i) => { const p = proveItem(it); return { n: i + 1, topicId, q: p.q.replace(/^Work out: /, "").replace(/ =$/, ""), raw: it, plain: it.kind === "equiv" ? `${it.from} = ?/${it.toDen}` : it.expr, answer: p.answer }; }) };
}

// A formal (recorded, moderated) task from earlier in the term, used by the prepared demo run.
const RAW2 = [
  [{ kind: "equiv", from: "2/5", toDen: 10 }, "equiv"], [{ kind: "equiv", from: "5/6", toDen: 12 }, "equiv"],
  [{ kind: "calc", expr: "3/8 + 2/8" }, "same"], [{ kind: "calc", expr: "7/10 - 3/10" }, "same"],
  [{ kind: "calc", expr: "3/4 + 1/8" }, "related"], [{ kind: "calc", expr: "5/6 - 1/3" }, "related"],
  [{ kind: "calc", expr: "2 1/2 + 1 1/4" }, "mixed"], [{ kind: "calc", expr: "3 2/3 - 1 1/3" }, "mixed"],
  [{ kind: "calc", expr: "2/3 of 18" }, "ofwhole"], [{ kind: "calc", expr: "3/5 of 25" }, "ofwhole"],
];
export function formalTask() {
  return { id: "formal-2026-11-06", name: "Mixed numbers task", date: "2026-11-06", type: "formal", total: RAW2.length,
    questions: RAW2.map(([it, topicId], i) => { const p = proveItem(it); return { n: i + 1, topicId, raw: it, q: p.q.replace(/^Work out: /, "").replace(/ =$/, ""), plain: it.kind === "equiv" ? `${it.from} = ?/${it.toDen}` : it.expr, answer: p.answer }; }) };
}
