// Builds demo/demo-run.json: a prepared Grade 6 Maths, Term 4, fractions run with MADE-UP learners.
// Marks, statuses and the three items waiting for the teacher are computed by the real Chommie logic, not typed in.
import { writeFileSync, readFileSync } from "node:fs";
import { learners } from "../shared/learners.js";
import { checkTask, formalTask, TOPICS } from "../shared/assessment.js";
import { resolveItem } from "../shared/marking.js";
import { checkAgainstCaps } from "../shared/caps.js";
import { buildPlan } from "../shared/planner.js";
import { buildHeat, topicDecisions } from "../shared/analyst.js";
import { codeLesson } from "../shared/lessonfallback.js";

const caps = JSON.parse(readFileSync("shared/caps-g6-t4.json")), official = JSON.parse(readFileSync("shared/official-atp-g6-t4.json"));
const check = checkTask(), formal = formalTask();
const WRONG1 = ["1/6", "3/8", "5/14", "7/9", "2/6", "3/9", "3 2/6", "3 2/6", "16", "100"];
const WRONG2 = ["2/10", "5/14", "5/16", "3/10", "4/12", "1/3", "3 3/5", "2 2/3", "6", "5"];
const NAMED = { 1: [0, 1, 4, 5, 6], 2: [4, 7], 3: [8], 4: [0, 4, 5, 6, 7, 8], 5: [6], 6: [2, 4, 5], 7: [], 14: [4], 22: [9], 31: [6] };
const num = (c) => Number(c.slice(-3));
const ans = (r, c, w, extra = {}) => ({ read: r, legible: true, confidence: 0.96, correct: c, evidence: `wrote ${w ?? r}`, page: 1, box: null, ...extra });

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const BASE = [0.2, 0.08, 0.5, 0.22, 0.14];

function build(seed) {
  const r = rng(seed), marks = { [check.id]: {}, [formal.id]: {} };
  for (const l of learners) {
    if (!l.consent) continue;
    const n = num(l.code), a = 0.45 + 0.55 * r();
    for (const [task, WR, bump] of [[check, WRONG1, 0], [formal, WRONG2, 1]]) {
      const wrongSet = new Set(NAMED[n] || TOPICS.flatMap((t, ti) => [0, 1].filter(() => r() < Math.min(0.9, BASE[ti] * (1.5 - a) * 1.5)).map((k) => ti * 2 + k)));
      const items = task.questions.map((q, i) => {
        const wrong = wrongSet.has(i), read = wrong ? WR[i] : q.answer;
        let A = ans(read, !wrong), B = ans(read, !wrong);
        if (task === check && n === 14 && i === 5) { A = ans("5/6", true, "5/6", { confidence: 0.9, evidence: "wrote 5/6 (bottom digit looks like a 6)" }); B = ans("5/8", false, "5/8", { evidence: "wrote 5/8: the bottom digit is open at the top" }); }
        if (task === check && n === 31 && i === 1) { A = ans("6/9", false, "6/9", { evidence: "read the last digit as a 9" }); B = ans("6/8", true, "6/8", { evidence: "wrote 6/8" }); }
        if (task === check && n === 22 && i === 4) { A = { read: "", legible: false, confidence: 0.35, correct: false, evidence: "numerator scribbled over with ink", page: 1, box: null }; B = { ...A, evidence: "[scribble]/4" }; }
        const res = resolveItem(q.answer, A, B);
        const it = { n: q.n, A, B, attempts: 0, ...res };
        if (task === check && n === 14 && i === 5) it.reviewer = { read: "5/8", legible: true, correct: false, reason: "The bottom digit is an 8, not a 6. Marker B read it correctly, so Marker A's tick was wrong." };
        if (task === check && n === 31 && i === 1) it.reviewer = { read: "6/8", legible: true, correct: true, reason: "The last digit is an 8. Marker A misread it as a 9, so Marker B was right." };
        return it;
      });
      (marks[task.id][l.code] = { code: l.code, pages: 1, at: "2026-11-13T12:00:00.000Z", items });
    }
  }
  return marks;
}
let marks, seed = 1;
for (; seed < 400; seed++) {
  marks = build(seed);
  const d = topicDecisions(buildHeat(marks, [check, formal]), { struggle: 50, reteach: 40 });
  const rd = d.find((x) => x.topicId === "related"), others = d.filter((x) => x.topicId !== "related");
  if (rd.share >= 42 && rd.share <= 56 && others.every((x) => x.share < 36 && x.share > 0)) break;
}
const atp = { ...official, source: "demo", notes: "Prepared demo run: the sample ATP photo, already read." };
const ck = checkAgainstCaps(atp, caps), plan = buildPlan(ck);
const day = plan.days.find((d) => d.date === "2026-11-16");
const lesson = codeLesson({ topic: day.topic, topicId: day.topicId, atpWeek: day.atpWeek, date: day.date });
const pend = Object.values(marks[check.id]).reduce((s, m) => s + m.items.filter((i) => i.status !== "agree").length, 0);
const run = {
  demo: true, today: "2026-11-13", settings: { struggle: 50, reteach: 40 },
  atp, check: ck, atpApproved: true, plan, planApproved: true, lessons: { [day.date]: { date: day.date, topic: day.topic, topicId: day.topicId, atpWeek: day.atpWeek, lesson, approved: true, prev: null } },
  learners, tasks: [check, formal], marks, marksConfirmed: { [check.id]: false, [formal.id]: true },
  homework: null, hod: { signed: false }, approvals: [],
  log: [
    ["Coordinator", "Loaded the prepared demo run", "Grade 6 Maths, Term 4, fractions. Made-up learners and books only."],
    ["Curriculum Reader", "ATP read", "Prepared demo run: the sample ATP photo was read and checked against CAPS. All 6 fractions topics present."],
    ["Term Planner", "Planned the term", "Prepared demo run: every topic on a real school day, test Thu 26 Nov, exam Wed 2 Dec."],
    ["Marker A", "Marked 32 books", "Prepared demo run (Fractions check, informal) and the formal Mixed numbers task."],
    ["Marker B", "Marked 32 books", "Prepared demo run: a second vendor marked the same books."],
    ["Reviewer", "Re-checked every mark", `Prepared demo run: ${pend} item(s) need the teacher: two disagreements the Reviewer re-read, one unclear answer.`],
  ].map(([agent, action, detail], i) => ({ at: `2026-11-13T12:0${i}:00.000Z`, agent, action, detail, meta: null })),
};
writeFileSync("demo/demo-run.json", JSON.stringify(run));
console.log("seed", seed, "pending", pend, JSON.stringify(topicDecisions(buildHeat(marks, [check, formal]), run.settings).map((d) => [d.topicId, d.share, d.action])));
