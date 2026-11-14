import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

const PROMPT = `You are Chommie's Curriculum Reader. The images are photos or pages of a South African Annual Teaching Plan (ATP), possibly several pages, and possibly the school's teaching planner. Read the term the teacher asked for if one is named; otherwise the term shown.
Extract ONLY what is written. Do not invent topics. If a cell is unreadable, set "unclear": true for that row.
Reply with JSON only, in this shape:
{"grade":6,"subject":"Mathematics","term":4,
 "weeks":[{"from":1,"to":2,"topic":"<topic text as written>","hours":null,"kind":"teach|revision|test|exam","unclear":false}],
 "notes":"<anything the teacher should know, or empty>"}
Use kind "test" for a row that is a revision plus test week and "exam" for the exam week.`;

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const { images, term } = await req.json().catch(() => ({}));
  if (!Array.isArray(images) || !images.length || images.length > 8 || !images.every((i) => typeof i === "string" && i.startsWith("data:image/")))
    return jsonResponse({ error: "Send 1 to 8 images as data URLs" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Image ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: PROMPT + (term ? `\nThe teacher wants Term ${Number(term)} only.` : "") });
  try {
    const out = await callModel("curriculumReader", [{ role: "user", content }], { json: true, maxTokens: 2500 });
    const atp = parseJson(out.text);
    if (!Array.isArray(atp.weeks)) throw new Error("No weeks in the reply");
    return jsonResponse({ atp, meta: logMeta(out) });
  } catch (e) {
    return jsonResponse({ error: String(e.message).slice(0, 300) }, 502);
  }
};
export const config = { path: "/api/read-atp" };
