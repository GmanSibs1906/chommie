import { callModel, roles, jsonResponse, logMeta } from "../lib/ai.mjs";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// One real call per distinct model ID. Vision IDs also get an image.
export default async () => {
  const seen = new Map();
  for (const [role, r] of Object.entries(roles)) {
    if (!seen.has(r.id)) seen.set(r.id, { role, vision: r.vision });
  }
  const results = await Promise.all([...seen].map(async ([id, { role, vision }]) => {
    try {
      const content = vision
        ? [{ type: "image_url", image_url: { url: "data:image/png;base64," + PNG } }, { type: "text", text: "Reply with the single word OK." }]
        : "Reply with the single word OK.";
      const out = await callModel(role, [{ role: "user", content }], { maxTokens: 300 });
      return { id, role, vision, ok: /ok/i.test(out.text), reply: out.text.slice(0, 40), ...logMeta(out) };
    } catch (e) {
      return { id, role, vision, ok: false, error: String(e.message).slice(0, 300) };
    }
  }));
  return jsonResponse({ ok: results.every(r => r.ok), results });
};
export const config = { path: "/api/selftest" };
