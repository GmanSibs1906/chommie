import { callModel, parseJson, jsonResponse, logMeta } from "../lib/ai.mjs";
import { SCHEMA } from "../lib/lessonprompt.mjs";

// Voice note (WAV, base64) or typed text -> instruction -> rewritten lesson.
export default async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  const b = await req.json().catch(() => ({}));
  if (!b.lesson || (!b.audio && !b.text)) return jsonResponse({ error: "Send a lesson and either audio or text" }, 400);
  if (b.audio && String(b.audio).length > 4_000_000) return jsonResponse({ error: "Voice note too long (keep it under 30 seconds)" }, 413);
  const metas = [];
  try {
    let transcript = String(b.text || "").slice(0, 500);
    if (b.audio) {
      const t = await callModel("voice", [{ role: "user", content: [
        { type: "text", text: "Transcribe this short voice note from a teacher exactly. Reply with the words only." },
        { type: "input_audio", input_audio: { data: b.audio, format: "wav" } }] }], { maxTokens: 200 });
      transcript = t.text.trim(); metas.push(logMeta(t));
    }
    if (!transcript) return jsonResponse({ error: "I could not hear anything in that voice note. Please try again or type it." }, 422);
    const L = b.lesson;
    const prompt = `You are Chommie's Lesson Writer. A South African Grade 6 Maths teacher (Term 4, fractions) asked to change this lesson.
Teacher's instruction: "${transcript}"
Keep the SAME topic "${String(L.topic || L.title).slice(0, 100)}" and stay inside it. Apply the instruction. If it says "shorter", reduce the outline minutes (total about ${Math.round((L.minutes || 60) * 0.75)} minutes), keep fewer questions (2 examples to 1, 5 class work to 3, 3 homework to 2) and shorten the steps.
Current lesson (answers omitted):
${JSON.stringify({ title: L.title, outline: L.outline, examples: (L.examples || []).map(strip), classWork: (L.classWork || []).map(strip), homework: (L.homework || []).map(strip) })}
${SCHEMA}`;
    const out = await callModel("lessonWriter", [{ role: "user", content: prompt }], { json: true, maxTokens: 3000, temperature: 0.2 });
    metas.push(logMeta(out));
    return jsonResponse({ transcript, lesson: parseJson(out.text), metas });
  } catch (e) { return jsonResponse({ error: String(e.message).slice(0, 300) }, 502); }
};
const strip = (i) => (i.kind === "calc" ? { kind: "calc", expr: i.expr } : i.kind === "equiv" ? { kind: "equiv", from: i.from, toDen: i.toDen } : i.kind === "simplify" ? { kind: "simplify", from: i.from } : { kind: "text", q: i.q, answer: i.answer });
export const config = { path: "/api/voice-edit" };
