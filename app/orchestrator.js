// Coordinator for marking: hands each learner's pages to two markers (different vendors), asks the Reviewer to re-check,
// sends work back at most twice, and routes anything still in doubt to the teacher.
import { state, save, log, api } from "./state.js";
import { listPhotos, blobToDataUrl } from "./db.js";
import { resolveItem } from "../shared/marking.js";
import { checkTask } from "../shared/assessment.js";

export function getTasks() { if (!state.tasks) { state.tasks = [checkTask()]; save(); } return state.tasks; }

async function retry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) { try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1200 * (i + 1))); } }
  throw last;
}
const by = (res) => Object.fromEntries((res?.answers || []).map((a) => [Number(a.n), a]));

export async function markLearner(task, code, onStep = () => {}) {
  const photos = (await listPhotos()).filter((p) => p.code === code).sort((a, b) => a.page - b.page);
  const images = await Promise.all(photos.map((p) => blobToDataUrl(p.blob)));
  const call = (role, extra = {}) => retry(() => api("/api/mark", { role, code, images, questions: task.questions, ...extra }));
  onStep("Markers A and B are reading");
  const full = (r) => (r.answers || []).length >= task.questions.length;
  const callFull = async (role) => { let r = await call(role); if (!full(r)) r = await call(role); return r; }; // one more try if a marker came back short
  const [ra, rb] = await Promise.all([callFull("A"), callFull("B")]);
  log("Marker A", "Marked " + code, `${ra.answers.length} answers read from ${images.length} page(s)`, ra.meta);
  log("Marker B", "Marked " + code, `${rb.answers.length} answers read from ${images.length} page(s)`, rb.meta);
  const A = by(ra), B = by(rb);
  const items = task.questions.map((q) => ({ n: q.n, A: A[q.n] || null, B: B[q.n] || null, attempts: 0 }));
  const q = (n) => task.questions.find((x) => x.n === n);
  for (const it of items) Object.assign(it, resolveItem(q(it.n).answer, it.A, it.B));
  // The Reviewer re-checks everything in code; a marker whose mark contradicts its own reading is sent back, twice at most.
  for (const it of items.filter((i) => i.status === "sendback")) {
    for (let attempt = 1; attempt <= 2 && it.status === "sendback"; attempt++) {
      it.attempts = attempt; onStep(`Reviewer sent Q${it.n} back (attempt ${attempt})`);
      for (const who of it.who) {
        const cur = who === "A" ? it.A : it.B;
        const r = await call(who, { recheck: { n: it.n, note: `You read "${cur.read}" and marked it ${cur.correct ? "correct" : "wrong"}, but the memo answer is ${q(it.n).answer}. Re-check your reading and your mark.` } });
        const fixed = by(r)[it.n]; if (fixed) it[who] = fixed;
        log("Reviewer", `Sent Q${it.n} of ${code} back to marker ${who}`, `Attempt ${attempt}`, r.meta);
      }
      Object.assign(it, { who: undefined }, resolveItem(q(it.n).answer, it.A, it.B));
    }
    if (it.status === "sendback") { it.status = "teacher"; it.reason = "Still wrong after two fixes"; log("Reviewer", `Q${it.n} of ${code} goes to the teacher`, "Failed two fixes"); }
  }
  const dis = items.filter((i) => i.status === "disagree");
  await Promise.all(dis.map(async (it) => {
    onStep(`Reviewer is re-reading Q${it.n}`);
    try {
      const r = await retry(() => api("/api/review", { code, images, question: q(it.n), A: it.A, B: it.B }));
      it.reviewer = r.review; log("Reviewer", `Re-read Q${it.n} of ${code}`, `Markers disagreed. Reviewer read "${r.review.read}"`, r.meta);
    } catch (e) { it.reviewer = null; log("Reviewer", `Could not re-read Q${it.n} of ${code}`, e.message); }
  }));
  (state.marks[task.id] ||= {})[code] = { code, pages: images.length, at: new Date().toISOString(), items };
  state.marksConfirmed[task.id] = false; save();
  return state.marks[task.id][code];
}

export async function markAll(task, codes, onStep) {
  const queue = [...codes];
  const worker = async () => { while (queue.length) { const c = queue.shift(); try { await markLearner(task, c, (m) => onStep(c, m)); onStep(c, "done"); } catch (e) { onStep(c, "error: " + e.message); } } };
  await Promise.all([worker(), worker()]); // two at a time, inside the vendors' rate limits
}
