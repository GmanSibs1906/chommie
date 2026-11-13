// Fallbacks made by plain code, used only when the live model cannot be reached. Always labelled as prepared drafts.
import { proveLesson } from "./lesson.js";
import { codeBank } from "./homework.js";

export const PREPARED = "Prepared draft (the live model could not be reached). Answers are still proven by calculation.";

export function codeLesson({ topic, topicId, atpWeek, date, minutes = 60, reteach }) {
  const b = codeBank("lesson-" + topicId)[topicId] || codeBank("lesson-equiv").equiv;
  let st = { starter: 5, teach: 15, examples: 10, classwork: 20, recap: 10 }, take = reteach?.minutes || 0;
  for (const [k, min] of [["classwork", 8], ["teach", 8], ["recap", 4], ["examples", 6]]) { const t = Math.min(take, st[k] - min); if (t > 0) { st[k] -= t; take -= t; } }
  const outline = [
    ...(reteach ? [{ step: `Class re-teach: ${reteach.topic}. Use the fraction wall, then two quick examples on the board.`, minutes: reteach.minutes }] : []),
    { step: "Starter: two quick questions from last lesson", minutes: st.starter },
    { step: `Teach the idea: ${topic}`, minutes: st.teach },
    { step: "Worked examples on the board", minutes: st.examples },
    { step: "Class work, learners work alone", minutes: st.classwork },
    { step: "Mark together and recap", minutes: st.recap },
  ];
  return proveLesson({ title: topic, outline, examples: b.practice.slice(0, 2), classWork: b.practice.slice(2, 6).concat(b.stretch.slice(0, 1)), homework: b.practice.slice(4, 6).concat(b.practice.slice(0, 1)) },
    { topic, topicId, atpWeek, date, minutes, source: PREPARED });
}

// "Make it shorter" by code: fewer questions, outline scaled to about 75% of the time.
export function shortenLesson(L) {
  const total = L.outline.reduce((s, o) => s + o.minutes, 0), k = 0.75;
  const outline = L.outline.slice(0, Math.max(4, L.outline.length - 1)).map((o) => ({ ...o, minutes: Math.max(2, Math.round(o.minutes * k)) }));
  const out = { ...L, outline, examples: L.examples.slice(0, 1), classWork: L.classWork.slice(0, 3), homework: L.homework.slice(0, 2), source: PREPARED };
  out.unproven = [...out.examples, ...out.classWork, ...out.homework].filter((i) => !i.proven).length;
  return out;
}
