import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";
import { SCHEMA } from "../lib/lessonprompt.mjs";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const topic = String(b.topic || "").slice(0, 120), minutes = Math.min(90, Math.max(20, Number(b.minutes) || 60));
  if (!topic) return jsonResponse({ error: "topic is required" }, 400);
  const re = b.reteach && b.reteach.topic ? `\nThe class got "${String(b.reteach.topic).slice(0, 100)}" wrong, so START with a ${Number(b.reteach.minutes) || 15} minute class re-teach of it, then teach the new content in the remaining time. Total outline minutes must equal ${minutes}.` : "";
  const prompt = `You are Chommie's Lesson Writer for a South African Grade 6 Mathematics teacher, Term 4, CAPS. Write ONE lesson of ${minutes} minutes on this ATP topic only: "${topic}" (ATP week ${Number(b.atpWeek) || ""}). Fractions only. Do not add topics outside it.${re}
Outline steps' minutes must add up to ${minutes}. Examples: 2 worked examples. Class work: 5 questions, easy to harder. Homework: 3 questions.
${SCHEMA}`;
  try {
    const out = await callModel("lessonWriter", [{ role: "user", content: prompt }], { json: true, maxTokens: 3000, temperature: 0.3 });
    return jsonResponse({ lesson: parseJson(out.text), meta: logMeta(out) });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
export const config = { path: "/api/write-lesson" };
