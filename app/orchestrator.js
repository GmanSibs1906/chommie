// Coordinator for marking: hands each learner's pages to two markers (different vendors), asks the Reviewer to re-check,
// sends work back at most twice, and routes anything still in doubt to the teacher.
import { state, save, log, api } from "./state.js";
import { listPhotos, blobToDataUrl, putPhoto, kindOf } from "./db.js";
import { resolveItem } from "../shared/marking.js";
import { checkTask } from "../shared/assessment.js";
import { matchSheet, hwTask, hwTaskId } from "../shared/hwmark.js";

export function getTasks() { if (!state.tasks) { state.tasks = [checkTask()]; save(); } return state.tasks; }

async function retry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) { try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1200 * (i + 1))); } }
  throw last;
}
const by = (res) => Object.fromEntries((res?.answers || []).map((a) => [Number(a.n), a]));

// opts.questions: the learner's OWN sheet questions and memo (personal homework). opts.photos: exactly the pages to read.
export async function markLearner(task, code, onStep = () => {}, opts = {}) {
  const questions = opts.questions || task.questions, task0 = task; task = { ...task, questions };
  const photos = (opts.photos || (await listPhotos()).filter((p) => p.code === code && kindOf(p) === "class")).sort((a, b) => a.page - b.page);
  const images = await Promise.all(photos.map((p) => blobToDataUrl(p.blob)));
  const call = (role, extra = {}) => retry(() => api("/api/mark", { role, code, images, questions: task.questions, ...extra }));
  onStep("Markers A and B are reading");
  const full = (r) => (r.answers || []).length >= task.questions.length;
  const callFull = async (role) => { let r = await call(role); if (!full(r)) r = await call(role); return r; }; // one more try if a marker came back short
  let [ra, rb] = await Promise.all([callFull("A"), callFull("B")]);
  // A marker that comes back with (almost) nothing must not turn the whole book into "unclear" for the teacher
  // (Gman's real test, 2026-11-14: Marker B returned nothing for Sipho, so 10 of 10 went to the teacher). Ask again;
  // if it still has nothing, stop and say so. The photos stay queued, so "Mark" simply tries again.
  const thin = (r) => (r.answers || []).length < Math.ceil(task.questions.length / 2);
  for (const [who, get, put] of [["A", () => ra, (r) => (ra = r)], ["B", () => rb, (r) => (rb = r)]]) {
    if (!thin(get())) continue;
    onStep(`Marker ${who} answered too little, asking again`);
    try { put(await call(who)); } catch {}
    if (thin(get())) throw new Error(`Marker ${who} (${who === "A" ? "Anthropic" : "Google"}) did not read this book. Nothing was saved; tap Mark to try again.`);
  }
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
  // The Reviewer re-reads every disagreement AND every answer where only one marker was unsure (Gman's test,
  // 2026-11-14: a heavy "8" went straight to the teacher with no third reading). The teacher still decides.
  const dis = items.filter((i) => i.status === "disagree" || (i.status === "unclear" && (i.who || []).length === 1));
  await Promise.all(dis.map(async (it) => {
    onStep(`Reviewer is re-reading Q${it.n}`);
    try {
      const r = await retry(() => api("/api/review", { code, images, question: q(it.n), A: it.A, B: it.B }));
      it.reviewer = r.review; log("Reviewer", `Re-read Q${it.n} of ${code}`, `${it.status === "disagree" ? "Markers disagreed" : "One marker was unsure"}. Reviewer read "${r.review.read}"`, r.meta);
    } catch (e) { it.reviewer = null; log("Reviewer", `Could not re-read Q${it.n} of ${code}`, e.message); }
  }));
  (state.marks[task0.id] ||= {})[code] = { code, pages: images.length, at: new Date().toISOString(), items, ...(opts.sheetId ? { sheetId: opts.sheetId } : {}) };
  state.marksConfirmed[task0.id] = false; save();
  return state.marks[task0.id][code];
}

export async function markAll(task, codes, onStep) {
  const queue = [...codes];
  const worker = async () => { while (queue.length) { const c = queue.shift(); try { await markLearner(task, c, (m) => onStep(c, m)); onStep(c, "done"); } catch (e) { onStep(c, "error: " + e.message); } } };
  await Promise.all([worker(), worker()]); // two at a time, inside the vendors' rate limits
}

// ---- Personal homework: match every snapped page to a learner AND to that learner's own sheet, then mark against its own memo ----
export function homeworkTask(round) {
  const t = getTasks(); let task = t.find((x) => x.id === hwTaskId(round));
  if (!task) { task = hwTask(round); t.push(task); save(); }
  return task;
}
export const queuedHomework = async () => (await listPhotos()).filter((p) => kindOf(p) === "homework" && p.status === "queued");

async function hold(photos, reason, claimed) {
  for (const p of photos) await putPhoto({ ...p, status: "held", holdReason: reason, claimed: claimed || null });
}
export async function markHomeworkLearner(code, onStep = () => {}) {
  const photos = (await queuedHomework()).filter((p) => p.code === code).sort((a, b) => a.page - b.page);
  if (!photos.length) return null;
  let printed = null;
  if (!photos.some((p) => p.qr)) { // no QR could be read in the browser: Marker A reads the printed code and sheet id
    onStep("Marker A is reading the printed code");
    const images = await Promise.all(photos.map((p) => blobToDataUrl(p.blob)));
    try { const r = await retry(() => api("/api/identify", { code, images })); printed = r.printed || null; log("Marker A", "Read the printed code of " + code, printed ? `Read ${printed.code} / ${printed.id}` : "Could not read it", r.meta); }
    catch (e) { log("Marker A", "Could not read the printed code of " + code, e.message); }
  }
  const m = matchSheet({ picked: code, qrs: photos.map((p) => p.qr), printed, sheets: state.hwSheets || {} });
  if (!m.ok) {
    await hold(photos, m.reason, m.claimed);
    log("Coordinator", `Held ${photos.length} page(s) picked as ${code} for the teacher`, m.reason);
    onStep("held: " + m.reason); return { held: true, reason: m.reason };
  }
  const sheet = m.sheet, task = homeworkTask(sheet.round);
  task.perLearner[code] = { sheetId: sheet.id, questions: sheet.questions };
  task.total = Math.max(task.total, sheet.questions.length);
  log("Coordinator", `Matched ${code} to sheet ${sheet.id}`, `Matched by the ${m.via === "qr" ? "QR read in the browser" : "printed code read by Marker A"} and the learner picked on Snap books. Marking against this learner's own ${sheet.questions.length} questions and memo.`);
  await markLearner(task, code, onStep, { questions: sheet.questions, photos, sheetId: sheet.id });
  return { task, held: false };
}
export async function markHomeworkAll(codes, onStep) {
  const queue = [...codes];
  const worker = async () => { while (queue.length) { const c = queue.shift(); try { const r = await markHomeworkLearner(c, (m) => onStep(c, m)); onStep(c, r?.held ? "held: " + r.reason : "done"); } catch (e) { onStep(c, "error: " + e.message); } } };
  await Promise.all([worker(), worker()]);
}
