// Turns a model's draft lesson into a lesson whose memo is PROVEN by calculation.
import { evalExpr, fmtFrac, parseFrac, F, pretty } from "./fractions.js";

export function proveItem(it) {
  const out = { kind: it.kind, id: it.id, proven: false };
  try {
    if (it.kind === "calc") {
      const ans = fmtFrac(evalExpr(it.expr));
      Object.assign(out, { expr: it.expr, q: `Work out: ${pretty(it.expr)} =`, answer: ans, proven: true });
      if (it.answer && String(it.answer).replace(/\s+/g, "") !== ans.replace(/\s+/g, "") && it.answer !== undefined) out.corrected = String(it.answer);
    } else if (it.kind === "equiv") {
      const f = parseFrac(it.from), den = Number(it.toDen), num = (f.n * den) / f.d;
      if (!Number.isInteger(num) || !den) throw new Error("not an exact equivalent");
      Object.assign(out, { from: it.from, toDen: den, q: `${pretty(it.from)} = ?/${den}`, answer: `${num}/${den}`, proven: true });
    } else if (it.kind === "simplify") {
      const f = parseFrac(it.from);
      Object.assign(out, { from: it.from, q: `Simplify ${pretty(it.from)} to its simplest form =`, answer: fmtFrac(f), proven: true });
    } else {
      Object.assign(out, { q: String(it.q || ""), answer: String(it.answer || ""), proven: false });
    }
  } catch (e) { Object.assign(out, { q: String(it.q || it.expr || it.from || ""), answer: "", error: e.message }); }
  return out;
}
export function proveLesson(raw, meta = {}) {
  const items = (a) => (Array.isArray(a) ? a : []).map((it, i) => proveItem({ ...it, id: it.id || "q" + (i + 1) }));
  const L = {
    ...meta,
    title: String(raw.title || meta.topic || ""),
    outline: (Array.isArray(raw.outline) ? raw.outline : []).map((o) => ({ step: String(o.step ?? o), minutes: Number(o.minutes) || 0 })),
    examples: items(raw.examples), classWork: items(raw.classWork), homework: items(raw.homework),
  };
  L.unproven = [...L.examples, ...L.classWork, ...L.homework].filter((i) => !i.proven).length;
  L.corrected = [...L.examples, ...L.classWork, ...L.homework].filter((i) => i.corrected).length;
  return L;
}
export const allItems = (L) => [...L.examples, ...L.classWork, ...L.homework];
