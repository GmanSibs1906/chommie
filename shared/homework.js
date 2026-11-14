// Personal homework, assembled by plain code from what each learner got wrong. Every answer is proven by calculation.
import { proveItem } from "./lesson.js";
import { finalCorrect } from "./marking.js";
import { buildHeat, cellState } from "./analyst.js";
import { questionsFor } from "./hwmark.js";

function rng(seed) { let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const pick = (r, a) => a[Math.floor(r() * a.length)];

// Fallback bank made by code (used if the model is unavailable). Same shapes the Lesson Writer returns.
export function codeBank(seed = "bank") {
  const r = rng(seed), out = {};
  const equiv = () => { const [n, d] = pick(r, [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [1, 4], [5, 6]]); return { kind: "equiv", from: `${n}/${d}`, toDen: d * pick(r, [2, 3, 4, 5]) }; };
  const same = () => { const d = pick(r, [5, 6, 7, 8, 9, 10]), a = 1 + Math.floor(r() * (d - 3)), b = 1 + Math.floor(r() * (d - a - 1)); return { kind: "calc", expr: r() < 0.5 ? `${a}/${d} + ${b}/${d}` : `${a + b}/${d} - ${b}/${d}` }; };
  const related = () => { const [x, y] = pick(r, [["1/2", "1/4"], ["1/3", "1/6"], ["2/3", "1/6"], ["3/4", "1/8"], ["1/2", "1/6"], ["2/5", "1/10"], ["5/6", "1/12"]]); return { kind: "calc", expr: r() < 0.7 ? `${x} + ${y}` : `${x} - ${y}` }; };
  const mixed = () => ({ kind: "calc", expr: `${1 + Math.floor(r() * 3)} ${pick(r, ["1/2", "1/3", "1/4", "2/3"])} + ${1 + Math.floor(r() * 3)} ${pick(r, ["1/2", "1/3", "1/4", "1/6"])}`.replace(/(\d) 1\/3 \+ (\d) 1\/6/, "$1 1/3 + $2 1/3") });
  const ofwhole = () => { const d = pick(r, [3, 4, 5, 6, 8]), n = 1 + Math.floor(r() * (d - 1)); return { kind: "calc", expr: `${n}/${d} of ${d * pick(r, [2, 3, 4, 5])}` }; };
  const hard = { equiv: () => ({ kind: "simplify", from: pick(r, ["18/24", "20/30", "12/16", "35/42", "24/36"]) }),
    same: () => ({ kind: "calc", expr: `${pick(r, ["7/12", "11/15", "9/11"])} + ${pick(r, ["3/12", "2/15", "1/11"])} - ${pick(r, ["1/12", "1/15", "2/11"])}`.replace(/(\d+)\/\d+ \+ (\d+)\/(\d+) - (\d+)\/\d+/, (m, a, b, d, c) => `${a}/${d} + ${b}/${d} - ${c}/${d}`) }),
    related: () => ({ kind: "calc", expr: pick(r, ["2/3 + 1/6 + 1/2", "3/4 + 1/8 + 1/2", "5/6 - 1/3 + 1/12"]) }),
    mixed: () => ({ kind: "calc", expr: pick(r, ["2 1/2 + 1 3/4", "3 1/3 - 1 1/6", "4 3/4 - 2 1/2"]) }),
    ofwhole: () => ({ kind: "calc", expr: pick(r, ["5/8 of 24", "7/9 of 45", "3/7 of 56"]) }),
    decimals: () => ({ kind: "calc", expr: pick(r, ["0.75 + 1/8", "0.6 + 3/10", "1.5 - 3/4", "2 1/4 + 0.5"]) }) };
  const decimals = () => ({ kind: "calc", expr: pick(r, ["0.5 + 1/4", "3/4 + 0.25", "0.75 - 1/4", "1/2 + 0.3", "0.2 + 1/5", "1/4 + 0.5", "0.6 - 1/10"]) });
  const mk = { equiv, same, related, mixed, ofwhole, decimals };
  for (const t of Object.keys(mk)) out[t] = { practice: Array.from({ length: 6 }, mk[t]), stretch: Array.from({ length: 3 }, hard[t]) };
  return out;
}
export function proveBank(raw) {
  const out = {};
  for (const [t, v] of Object.entries(raw)) out[t] = { practice: (v.practice || []).map((i) => proveItem(i)).filter((i) => i.proven), stretch: (v.stretch || []).map((i) => proveItem(i)).filter((i) => i.proven) };
  return out;
}

// One sheet per marked learner. Wrong answers come back first ("Try again"), then practice from the bank on the same topic.
export function buildHomework({ marks, tasks, bank, settings }) {
  const heat = buildHeat(marks, tasks), sheets = {};
  let k = 0;
  for (const code of Object.keys(heat).sort()) {
    const r = rng(code), items = [], topics = [];
    for (const t of tasks) {
      const m = (marks[t.id] || {})[code]; if (!m) continue;
      for (const q of questionsFor(t, code)) { const it = m.items.find((i) => i.n === q.n); if (it && finalCorrect(it) === false) {
        if (!topics.includes(q.topicId)) topics.push(q.topicId);
        items.push({ ...proveItem(q.raw), topicId: q.topicId, source: "retry", id: `r${q.n}` }); } }
    }
    for (const tid of topics) {
      const pool = (bank[tid]?.practice || []).slice(); const n = items.filter((i) => i.topicId === tid && i.source === "retry").length;
      for (let i = 0; i < Math.min(2, pool.length); i++) { const p = pool.splice(Math.floor(r() * pool.length), 1)[0]; items.push({ ...p, topicId: tid, source: "practice", id: `${tid}-p${i}` }); }
    }
    const row = heat[code], ahead = Object.values(row).every((c) => !c.pending && c.of > 0 && cellState(c, settings) === "green");
    if (ahead) for (const tid of Object.keys(row)) { const s = bank[tid]?.stretch?.[k % Math.max(1, bank[tid]?.stretch?.length || 1)]; if (s) items.push({ ...s, topicId: tid, source: "stretch", id: `${tid}-s` }); }
    k++;
    sheets[code] = { code, topics, stretch: ahead, items, approved: false, edited: false };
  }
  return sheets;
}
export const minutesFor = (sheet) => Math.max(5, Math.round(sheet.items.length * 3 / 5) * 5);
