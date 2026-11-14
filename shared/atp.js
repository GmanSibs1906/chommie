// Real ATPs (DBE library or the teacher's own upload): plain code, no model. Used from the browser and from the tests.
import { schoolDays, addDays, dow, mondayOf, TERM4_2026 } from "./planner.js";

export const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "topic";

// 2026 South African public school terms and the public holidays inside them.
const TERMS_2026 = {
  1: { start: "2026-01-14", end: "2026-03-27", holidays: [] },
  2: { start: "2026-04-08", end: "2026-06-26", holidays: ["2026-04-27", "2026-05-01", "2026-06-16"] },
  3: { start: "2026-07-21", end: "2026-10-02", holidays: ["2026-08-10", "2026-09-24"] },
  4: { start: "2026-10-06", end: "2026-12-09", holidays: [] },
};

// Rows whose weeks were not readable (0) get consecutive weeks worked out from their hours: one week = the most common hours value.
export function fillWeeks(atp) {
  const rows = (atp.weeks || []).map((w) => ({ ...w })), hs = rows.map((w) => w.hours).filter((h) => h > 0);
  if (!rows.length || !rows.some((w) => !(w.from >= 1))) return { ...atp, weeks: rows };
  const count = {}; hs.forEach((h) => (count[h] = (count[h] || 0) + 1));
  const hpw = Number(Object.keys(count).sort((a, b) => count[b] - count[a] || a - b)[0]) || 0;
  let wk = 1;
  for (const w of rows) {
    if (w.from >= 1) { wk = Math.max(wk, (w.to || w.from) + 1); continue; }
    const n = hpw && w.hours ? Math.max(1, Math.round(w.hours / hpw)) : 1;
    w.from = wk; w.to = wk + n - 1; wk += n;
  }
  return { ...atp, weeks: rows };
}

// The official ATP is the source: every teaching row is accepted. Rows that are revision, a test or an exam are assessment rows.
export function checkOfficial(atp) {
  const seen = new Set(), rows = [];
  for (const w of atp.weeks || []) {
    if (w.kind && w.kind !== "teach") { rows.push({ ...w, status: "assessment" }); continue; }
    let id = slug(w.topic), n = 2; while (seen.has(id)) id = slug(w.topic) + "-" + n++;
    seen.add(id);
    rows.push({ ...w, status: "matched", capsId: id, capsName: w.topic });
  }
  return { rows, missing: [], ok: !rows.some((r) => r.unclear) };
}

const pickDay = (days, d, back = true) => { // nearest school day on/before (or after) d
  const set = new Set(days); let x = d;
  for (let i = 0; i < 10 && !set.has(x); i++) x = addDays(x, back ? -1 : 1);
  return set.has(x) ? x : null;
};

// Term dates for 2026. Test and exam come from the ATP's own assessment weeks when they give one, else a sensible default
// (exam: Wednesday of the second last week, test: Thursday a week before). The teacher can change both on the plan screen.
export function termCalendar(termNo, atp = {}) {
  const t = TERMS_2026[termNo] || TERMS_2026[4];
  const term = { name: `Term ${termNo} 2026`, ...t, lessonMin: 60, minRevisionMin: 60, warnRevisionMin: 120, termNo: Number(termNo) };
  const days = schoolDays(term), first = mondayOf(term.start), lastMon = mondayOf(term.end);
  let exam = pickDay(days, addDays(lastMon, -7 + 2)), test = pickDay(days, addDays(lastMon, -14 + 3));
  const weekDate = (wk, off) => addDays(first, 7 * (wk - 1) + off);
  const as = [...(atp.assessments || []), ...(atp.weeks || []).filter((w) => w.kind === "test" || w.kind === "exam").map((w) => ({ week: w.from, kind: w.kind }))];
  const tw = as.find((a) => (a.kind === "test" || a.kind === "task") && a.week >= 1);
  const ew = as.find((a) => a.kind === "exam" && a.week >= 1);
  const tCand = tw && pickDay(days, weekDate(tw.week, 3)), eCand = ew && pickDay(days, weekDate(ew.week, 2));
  if (eCand) exam = eCand;
  if (tCand && tCand < exam) test = tCand;
  if (!(test && exam && test < exam)) { test = days[Math.max(0, days.length - 8)]; exam = days[Math.max(1, days.length - 5)]; }
  return { ...term, test, exam };
}
export { TERM4_2026, dow };
