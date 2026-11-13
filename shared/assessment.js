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
