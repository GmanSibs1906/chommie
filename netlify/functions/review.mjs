import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

// The Reviewer (OpenAI) is a third, independent reader. It is called only when the two markers disagree.
export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const { code, images, question, A, B } = b;
  if (!/^[\w-]{3,20}$/.test(code || "") || !Array.isArray(images) || !images.length || images.length > 6 || !question) return jsonResponse({ error: "Bad request" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Image ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: `You are the independent Reviewer for a South African Grade 6 maths marking team. Two markers disagree about question ${question.n} in learner ${code}'s book.
Question: ${question.plain}. Memo answer: ${question.answer}.
Marker A read "${A?.read ?? ""}" and marked it ${A?.correct ? "correct" : "wrong"}. Marker B read "${B?.read ?? ""}" and marked it ${B?.correct ? "correct" : "wrong"}.
Look at the images yourself and decide what the learner really wrote for question ${question.n}. Do not guess a smudged digit: if you cannot be sure, set "legible": false. An answer is correct when its value equals the memo answer.
Reply with JSON only: {"read":"<final answer written>","legible":true,"correct":true,"reason":"<one plain sentence, name which marker was right>"}` });
  try {
    const out = await callModel("reviewer", [{ role: "user", content }], { json: true, maxTokens: 1500 });
    return jsonResponse({ review: parseJson(out.text), meta: logMeta(out) });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
export const config = { path: "/api/review" };
