import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

const PROMPT = `You are Chommie's Curriculum Reader. The images are photos of a South African Annual Teaching Plan (ATP) page and possibly the school's teaching planner.
Extract ONLY what is written. Do not invent topics. If a cell is unreadable, set "unclear": true for that row.
Reply with JSON only, in this shape:
{"grade":6,"subject":"Mathematics","term":4,
 "weeks":[{"from":1,"to":2,"topic":"<topic text as written>","kind":"teach|revision|test|exam","unclear":false}],
 "notes":"<anything the teacher should know, or empty>"}
Use kind "test" for a row that is a revision plus test week and "exam" for the exam week.`;

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const { images } = await req.json().catch(() => ({}));
  if (!Array.isArray(images) || !images.length || images.length > 3 || !images.every((i) => typeof i === "string" && i.startsWith("data:image/")))
    return jsonResponse({ error: "Send 1 to 3 images as data URLs" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Image ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: PROMPT });
  try {
    const out = await callModel("curriculumReader", [{ role: "user", content }], { json: true, maxTokens: 1500 });
    const atp = parseJson(out.text);
    if (!Array.isArray(atp.weeks)) throw new Error("No weeks in the reply");
    return jsonResponse({ atp, meta: logMeta(out) });
  } catch (e) {
    return jsonResponse({ error: String(e.message).slice(0, 300) }, 502);
  }
};
export const config = { path: "/api/read-atp" };
