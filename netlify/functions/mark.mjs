import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";
import { markPrompt } from "../lib/markprompt.mjs";

// One request per learner: ALL of that learner's pages, each labelled "Image N:", images BEFORE the memo text.
export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const role = b.role === "B" ? "markerB" : "markerA";
  const { code, images, questions } = b;
  if (!/^[\w-]{3,20}$/.test(code || "") || !Array.isArray(images) || !images.length || images.length > 6 || !Array.isArray(questions) || !questions.length)
    return jsonResponse({ error: "Send code, 1 to 6 images and the questions" }, 400);
  if (!images.every((i) => typeof i === "string" && i.startsWith("data:image/"))) return jsonResponse({ error: "Images must be data URLs" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Image ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: markPrompt({ code, questions, recheck: b.recheck }) });
  try {
    const out = await callModel(role, [{ role: "user", content }], { json: true, maxTokens: 6000 });
    const j = parseJson(out.text);
    if (!Array.isArray(j.answers)) throw new Error("Marker returned no answers");
    return jsonResponse({ role: b.role === "B" ? "B" : "A", answers: j.answers, meta: logMeta(out) });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
export const config = { path: "/api/mark" };
