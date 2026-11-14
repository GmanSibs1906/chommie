// "Caught & fixed": every self-correction Chommie made in a class, read from the class's real data (never made up).
// Gman, 2026-11-14: self-correction is the heart of Colleague Zero, so it must be visible in one place.
//   fixed : an agent's mistake was caught by another check and corrected
//   held  : a doubt was caught and NOT guessed; it waits for the teacher (or the teacher already decided)
const fmt = (a) => (!a ? "nothing" : a.unclear || a.legible === false || Number(a.confidence) < 0.8 ? `"${a.read ?? ""}" but was unsure` : `"${a.read ?? ""}" (${a.correct ? "correct" : "wrong"})`);

export function collectFixes(state, nameOf = (c) => c) {
  const out = [];
  for (const t of state.tasks || []) {
    const marks = (state.marks || {})[t.id] || {};
    for (const [code, m] of Object.entries(marks)) {
      const qs = t.kind === "homework" ? t.perLearner?.[code]?.questions || [] : t.questions || [];
      for (const it of m.items || []) {
        const q = qs.find((x) => x.n === it.n), where = `${t.name} · ${nameOf(code)} · Q${it.n}${q?.plain ? ` (${q.plain})` : ""}`;
        const memo = q?.answer ?? "";
        const src = it.A?.box ? it.A : it.B?.box ? it.B : it.A || it.B; // where the answer sits on the page, if a marker said
        const pic = { code, n: it.n, homework: t.kind === "homework", page: Number(src?.page) || 1, box: src?.box || null };
        const decided = it.decision ? `You decided: ${it.decision.correct ? "correct" : "wrong"}` : "";
        if (it.status === "disagree" || it.reviewer) {
          // A Reviewer reading is a suggestion until the teacher decides (Gman's real test, 2026-11-14: the Reviewer
          // read a heavy "8" as "6" and called a wrong answer correct; the teacher is the final check).
          const r = it.reviewer, rv = r ? (r.correct === true ? "correct" : r.correct === false ? "wrong" : "unclear") : null;
          const agrees = r && it.A && it.B && [it.A, it.B].some((m) => !(m.unclear || m.legible === false) && String(m.read) === String(r.read) && m.correct === r.correct);
          const said = r ? `Reviewer re-read the page: "${r.read ?? ""}"${memo ? ` (memo ${memo})`
            : ""}, so ${rv}` : "Sent to you to decide";
          if (it.decision) {
            const same = r && it.decision.correct === r.correct;
            out.push({ pic, kind: "fixed", place: "Marking", where, by: same ? "Reviewer (OpenAI), confirmed by you" : "You, the teacher",
              was: `Marker A read ${fmt(it.A)}, Marker B read ${fmt(it.B)}`,
              now: `${said}. ${decided}${r && !same ? " (you overruled the Reviewer)" : ""}`, note: "" });
          } else {
            out.push({ pic, kind: "held", place: "Marking", where, by: "Reviewer (OpenAI)",
              was: `Marker A read ${fmt(it.A)}, Marker B read ${fmt(it.B)}`,
              now: r ? `${agrees ? "Reviewer agrees" : "Reviewer suggests"}: "${r.read ?? ""}", so ${rv}. Waiting for your decision` : "Waiting for your decision", note: "" });
          }
        } else if (it.attempts > 0) {
          out.push({ pic, kind: "fixed", place: "Marking", where, by: "Reviewer (OpenAI)",
            was: "A marker's mark did not match its own reading", now: it.status === "teacher" ? "Still wrong after two fixes, so it went to you" : `Sent back ${it.attempts}× and fixed by the marker`, note: decided });
        } else if (it.status === "unclear") {
          out.push({ pic, kind: "held", place: "Marking", where, by: "Marker A and Marker B",
            was: "Handwriting could not be read for sure", now: "Not guessed. Held for the teacher", note: decided });
        }
      }
    }
  }
  // Memo answers: a wrong AI answer is replaced by the one Chommie works out by calculation.
  const memo = (items, where) => (items || []).filter((i) => i && i.corrected).forEach((i) => out.push({ kind: "fixed", place: "Memo", where: `${where} · ${i.q || i.expr || ""}`,
    by: "Lesson Writer, checked by calculation", was: `AI wrote ${i.corrected}`, now: `Calculated: ${i.answer}`, note: "" }));
  for (const [day, e] of Object.entries(state.lessons || {})) { const L = e?.lesson || e; if (L) { const t = L.title || e.topic || day; memo(L.examples, `Lesson ${t}`); memo(L.classWork, `Lesson ${t}`); memo(L.homework, `Lesson ${t}`); } }
  for (const [tid, b] of Object.entries(state.bank || {})) { memo(b?.practice, `Homework questions (${tid})`); memo(b?.stretch, `Stretch questions (${tid})`); }
  // The ATP: topics the Curriculum Reader could not match to CAPS are flagged, never quietly planned.
  const check = state.check;
  if (check) {
    for (const r of check.rows || []) if (r.status === "extra") out.push({ kind: "held", place: "ATP", where: `Week ${r.from}${r.to && r.to !== r.from ? "-" + r.to : ""}: ${r.topic}`, by: "Curriculum Reader", was: "Topic not found in CAPS", now: "Flagged, not planned until you approve it", note: "" });
    for (const mi of check.missing || []) out.push({ kind: "held", place: "ATP", where: mi.name, by: "Curriculum Reader", was: "Required CAPS topic missing from the ATP", now: "Flagged so it is not silently dropped", note: "" });
  }
  return out;
}
export const fixCounts = (list) => ({ fixed: list.filter((f) => f.kind === "fixed").length, held: list.filter((f) => f.kind === "held").length });
