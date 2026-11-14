import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import catalog from "../../data/dbe-atp-catalog.json" with { type: "json" };
import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";
import { pdfPages, termSection, capText } from "../lib/pdftext.mjs";

const PROMPT = (g, s, t) => `You are Chommie's Curriculum Reader. Below is the text of a South African DBE Annual Teaching Plan (ATP), laid out as a table: columns are separated by " | " and the WEEK columns run left to right. It is for Grade ${g}, ${s}, Term ${t}.
Read ONLY Term ${t}. Extract exactly what is written: the topic of each column or block, its hours ("hrs"), the weeks it covers, and the assessment items (assessment task, test, exam, revision).
Do not use any topic from memory or from another term. Never invent a topic. If something cannot be read, set "unclear": true.
Reply with JSON only, in this shape:
{"grade":${g},"subject":"${s}","term":${t},
 "weeks":[{"from":1,"to":1,"topic":"<topic heading exactly as written, in normal capitalisation>","hours":9,"kind":"teach|revision|test|exam","unclear":false}],
 "assessments":[{"name":"<as written>","week":8,"kind":"task|test|exam"}],
 "notes":"<anything the teacher should know, or empty>"}
Rules: if the text does not show which weeks a topic covers, set "from" and "to" to 0 and the app works them out from the hours; never write null. Keep "notes" under 200 characters. One row per topic, in the order of the weeks. "hours" is the number of hours given for that topic (null if none is given). Use kind "revision" for revision rows and "test" for a row that is a test or formal assessment week, "exam" for the exam. Keep "topic" short (the heading, not the bullet points).`;

const store = (name) => { try { return getStore(name); } catch { return null; } };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  const term = Number(b.term);
  if (![1, 2, 3, 4].includes(term)) return jsonResponse({ error: "Pick a term from 1 to 4" }, 400);
  let buf, grade = String(b.grade || ""), subject = String(b.subject || ""), source;
  try {
    if (Number.isInteger(b.catalogId)) {
      const e = catalog[b.catalogId];
      if (!e || !/^https:\/\/www\.education\.gov\.za\//.test(e.source_url)) return jsonResponse({ error: "That ATP is not in the library" }, 400);
      grade = e.grade; subject = e.subject; source = "dbe";
      const pdfs = store("atp-pdfs"), key = e.fileticket.replace(/[^A-Za-z0-9]/g, "") + "-" + e.sha256.slice(0, 12);
      let cached = null; try { cached = pdfs && await pdfs.get(key, { type: "arrayBuffer" }); } catch {}
      if (cached) buf = new Uint8Array(cached);
      else {
        const r = await fetch(e.source_url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error("education.gov.za answered " + r.status);
        buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length > 6e6 || String.fromCharCode(...buf.slice(0, 4)) !== "%PDF") throw new Error("That file is not a readable PDF");
        try { await pdfs?.set(key, buf); } catch {}
      }
    } else if (typeof b.pdf === "string" && b.pdf.length < 8e6) {
      buf = new Uint8Array(Buffer.from(b.pdf, "base64")); source = "upload";
      if (String.fromCharCode(...buf.slice(0, 4)) !== "%PDF") return jsonResponse({ error: "That file is not a PDF" }, 400);
    } else return jsonResponse({ error: "Send a catalog id or a PDF" }, 400);

    const key = sha(buf) + "-t" + term, reads = store("atp-reads");
    try { const hit = reads && await reads.get(key, { type: "json" }); if (hit) return jsonResponse({ atp: { ...hit.atp, source }, meta: { ...hit.meta, cached: true }, pages: hit.pages }); } catch {}
    const pages = await pdfPages(buf);
    const section = termSection(pages, term), text = capText(section);
    if (text.replace(/\s/g, "").length < 200) return jsonResponse({ error: "No text could be read from this PDF (it may be a scan). Upload photos of the pages instead." }, 422);
    const out = await callModel("curriculumReader", [{ role: "user", content: PROMPT(grade || "?", subject || "the subject", term) + "\n\n=== ATP TEXT ===\n" + text }], { json: true, maxTokens: 6000 });
    let atp; try { atp = parseJson(out.text); } catch (e) { return jsonResponse({ error: "The Curriculum Reader answer could not be read", raw: String(out.text).slice(0, 1500), tail: String(out.text).slice(-300) }, 502); }
    if (!Array.isArray(atp.weeks) || !atp.weeks.length) throw new Error("No weeks in the reply");
    atp.weeks = atp.weeks.map((w) => ({ from: Math.max(0, Math.round(Number(w.from)) || 0), to: Math.max(0, Math.round(Number(w.to)) || Math.round(Number(w.from)) || 0), topic: String(w.topic || "").slice(0, 160), hours: w.hours == null ? null : Number(w.hours) || null, kind: ["teach", "revision", "test", "exam"].includes(w.kind) ? w.kind : "teach", unclear: !!w.unclear }));
    atp.grade = Number(grade) || atp.grade; atp.term = term; if (subject) atp.subject = subject;
    const meta = { ...logMeta(out), pagesRead: section.length, pagesTotal: pages.length };
    try { await reads?.setJSON(key, { atp, meta, pages: section.length }); } catch {}
    return jsonResponse({ atp: { ...atp, source }, meta, pages: section.length });
  } catch (e) {
    return jsonResponse({ error: String(e.message).slice(0, 300) }, 502);
  }
};
export const config = { path: "/api/atp-pdf" };
