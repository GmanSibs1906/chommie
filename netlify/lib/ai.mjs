// Shared OpenRouter helper. The key is read ONLY from the Netlify environment.
import models from "../../shared/models.json" with { type: "json" };

export const roles = models.roles;

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function callModel(role, messages, opts = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set in the Netlify environment");
  const r = roles[role];
  if (!r) throw new Error("Unknown role " + role);
  const body = { model: r.id, messages, max_tokens: opts.maxTokens || 1500, temperature: opts.temperature ?? 0 };
  if (opts.json) body.response_format = { type: "json_object" };
  if (r.id.startsWith("openai/")) body.reasoning = { effort: "low" };
  const t0 = Date.now();
  const res = await fetch(models.baseUrl + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "X-Title": "Chommie" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenRouter ${res.status} for ${r.id}: ${JSON.stringify(data).slice(0, 300)}`);
  const text = data.choices?.[0]?.message?.content ?? "";
  return {
    text, role, model: r.id, vendor: r.vendor, routing: models.routing,
    ms: Date.now() - t0, usage: data.usage || null,
  };
}

export function parseJson(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = m ? m[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

// Log entry the browser appends to the activity log (no learner data).
export function logMeta(r) {
  return { model: r.model, vendor: r.vendor, routing: r.routing, ms: r.ms, tokens: r.usage?.total_tokens ?? null, cost: r.usage?.cost ?? null };
}
