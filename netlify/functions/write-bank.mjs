import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

const NAMES = { equiv: "Equivalent fractions", same: "Add and subtract: same denominators", related: "Add and subtract: related denominators", mixed: "Mixed numbers", ofwhole: "Fractions of whole numbers" };
export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const topics = (Array.isArray(b.topics) ? b.topics : []).filter((t) => NAMES[t]).slice(0, 5);
  if (!topics.length) return jsonResponse({ error: "topics required" }, 400);
  const prompt = `You are Chommie's Lesson Writer for a South African Grade 6 Maths teacher (Term 4, CAPS, fractions). Write a question bank for personal homework on these topics: ${topics.map((t) => `${t} = ${NAMES[t]}`).join("; ")}.
For each topic: 6 "practice" items of the same level as the class work, and 3 "stretch" items that are harder for learners who are ahead (still the same topic, Grade 6).
Each item is exactly one of:
 {"kind":"calc","expr":"2/3 + 1/6"}      expr uses only digits, /, +, -, ×, ÷, "of", spaces; mixed number "1 1/2"; decimal "0.75"
 {"kind":"equiv","from":"3/4","toDen":8}   toDen must be an exact multiple of the denominator
 {"kind":"simplify","from":"18/24"}
Do NOT include answers: code computes them. Reply with JSON only: {"topics":{"<id>":{"practice":[ITEM x6],"stretch":[ITEM x3]}}}`;
  try {
    const out = await callModel("lessonWriter", [{ role: "user", content: prompt }], { json: true, maxTokens: 4000, temperature: 0.4 });
    return jsonResponse({ bank: parseJson(out.text).topics, meta: logMeta(out) });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
export const config = { path: "/api/write-bank" };
