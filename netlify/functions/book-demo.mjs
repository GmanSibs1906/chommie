import { getStore } from "@netlify/blobs";
import { jsonResponse } from "../lib/ai.mjs";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 160);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonResponse({ error: "Name and a valid email are required" }, 400);
  const rec = { name, email, role: String(b.role || "").slice(0, 60), when: String(b.when || "").slice(0, 160), at: new Date().toISOString() };
  try {
    await getStore("demo-requests").setJSON(`${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, rec);
  } catch (e) {
    console.log("demo request (blob store unavailable):", JSON.stringify(rec));
  }
  return jsonResponse({ ok: true });
};
export const config = { path: "/api/book-demo" };
