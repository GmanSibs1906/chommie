import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";

// Marker A reads the PRINTED learner code and sheet id from a homework page when no QR could be read in the browser.
// The black strip at the top is a mask; the code to read is the large print below it, and the sheet id is in the footer.
export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const { images } = b;
  if (!Array.isArray(images) || !images.length || images.length > 6 || !images.every((i) => typeof i === "string" && i.startsWith("data:image/")))
    return jsonResponse({ error: "Send 1 to 6 images as data URLs" }, 400);
  const content = [];
  images.forEach((url, i) => { content.push({ type: "text", text: `Image ${i + 1}:` }); content.push({ type: "image_url", image_url: { url } }); });
  content.push({ type: "text", text: `These are pages of one homework sheet. Ignore the black strip at the very top (a privacy mask).
Read the LARGE printed learner code (it looks like 6B-014) below the strip, and the sheet id printed at the bottom of the page (it looks like R1-6B-014-K3F2, after the word "Sheet").
Read exactly what is printed. Never guess: if either one is cut off, covered or you are not sure of every character, set "legible": false.
Reply with JSON only: {"code":"6B-014","id":"R1-6B-014-K3F2","legible":true}` });
  try {
    const out = await callModel("markerA", [{ role: "user", content }], { json: true, maxTokens: 400 });
    const j = parseJson(out.text), ok = j.legible !== false && /^[\w-]{3,20}$/.test(String(j.code || ""));
    return jsonResponse({ printed: ok ? { code: String(j.code).trim(), id: String(j.id || "").trim() } : null, meta: logMeta(out) });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
export const config = { path: "/api/identify" };
