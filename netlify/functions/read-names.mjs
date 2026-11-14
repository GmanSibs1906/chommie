import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

const PROMPT = `You are Chommie's Curriculum Reader. The image is a photo of a school class list (names of learners).
Read ONLY the learner names that are written. Do not invent or complete names. Split each into first name and surname (a surname like "de Beer" or "van Wyk" stays whole). If a name is hard to read, set "unclear": true and give your best reading.
Ignore headings, numbers, dates, ticks and teacher names. Reply with JSON only:
{"names":[{"first":"Nomsa","surname":"Dube","unclear":false}]}`;

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const { images } = await req.json().catch(() => ({}));
  if (!Array.isArray(images) || !images.length || images.length > 4 || !images.every((i) => typeof i === "string" && i.startsWith("data:image/")))
    return jsonResponse({ error: "Send 1 to 4 images as data URLs" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Page ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: PROMPT });
  try {
    const out = await callModel("curriculumReader", [{ role: "user", content }], { json: true, maxTokens: 3000 });
    const r = parseJson(out.text);
    const names = (r.names || []).map((n) => ({ first: String(n.first || "").trim().slice(0, 60), surname: String(n.surname || "").trim().slice(0, 60), unclear: !!n.unclear })).filter((n) => n.first || n.surname).slice(0, 80);
    if (!names.length) throw new Error("No names could be read. Try a clearer, straight-on photo.");
    return jsonResponse({ names, meta: logMeta(out) });
  } catch (e) {
    return jsonResponse({ error: String(e.message).slice(0, 300) }, 502);
  }
};
export const config = { path: "/api/read-names" };
