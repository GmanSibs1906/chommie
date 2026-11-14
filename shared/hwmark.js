// Personal homework marking: plain code. Sheet ids, the QR payload, matching a snapped page to the right learner and sheet,
// and the per-learner memo. The models only read; code decides which sheet a page belongs to.
import qrcode from "./vendor/qrcode.mjs";

const PREFIX = "CHOMMIE-HW";
const hash4 = (s) => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(36).toUpperCase().padStart(4, "0").slice(-4); };

// What the marker is shown for each question (plain text, same shape as a class-task question).
export function plainOf(it) {
  if (it.kind === "equiv") return `${it.from} = ?/${it.toDen}`;
  if (it.kind === "simplify") return `Simplify ${it.from} to its simplest form`;
  return it.expr || it.q;
}
export function rawOf(it) {
  if (it.kind === "equiv") return { kind: "equiv", from: it.from, toDen: it.toDen };
  if (it.kind === "simplify") return { kind: "simplify", from: it.from };
  return { kind: "calc", expr: it.expr };
}
// The sheet's own questions and proven memo, numbered 1..n in the order printed.
export function sheetQuestions(sheet) {
  return sheet.items.filter((i) => i.proven && i.answer !== "").map((it, i) => ({ n: i + 1, topicId: it.topicId, q: plainOf(it), plain: plainOf(it), raw: rawOf(it), answer: it.answer }));
}
// An edited sheet gets a new id because the id carries a hash of its questions and answers.
export function sheetId(sheet, round) {
  return `R${round}-${sheet.code}-${hash4(sheet.items.map((i) => plainOf(i) + "=" + i.answer).join("|"))}`;
}
// The approved sheet as printed. This snapshot, not the editable draft, is what a snapped page is marked against.
export function snapshot(sheet, round) {
  const id = sheetId(sheet, round);
  return { id, code: sheet.code, round, at: new Date().toISOString(), questions: sheetQuestions(sheet) };
}

export const qrPayload = (code, id) => `${PREFIX}|${code}|${id}`; // no learner name in the QR
export function parseQr(text) {
  const m = /^CHOMMIE-HW\|([\w-]{3,20})\|([\w-]{3,40})$/.exec(String(text || "").trim());
  return m ? { code: m[1], id: m[2] } : null;
}
export function qrMatrix(text) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount();
  return { size: n, dark: (r, c) => q.isDark(r, c) };
}
export function qrSvg(text, px = 3) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: px, margin: 2, scalable: true });
}
// Grey pixels of the QR (white quiet zone included), for tests and for drawing the made-up demo sheets.
export function qrRgba(text, scale = 6, quiet = 4) {
  const { size, dark } = qrMatrix(text), side = (size + quiet * 2) * scale, data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const r = Math.floor(y / scale) - quiet, c = Math.floor(x / scale) - quiet;
    if (r >= 0 && c >= 0 && r < size && c < size && dark(r, c)) { const i = (y * side + x) * 4; data[i] = data[i + 1] = data[i + 2] = 0; }
  }
  return { data, width: side, height: side };
}

// pages: the QRs read in the browser, one per page ({code,id} or null). printed: what Marker A read as the printed
// code and sheet id when no QR could be read. sheets: { id: snapshot } of approved sheets on this phone.
// Returns { ok:true, sheet, via } or { ok:false, reason, claimed } so a page that does not match goes to Check, never to a mark.
export function matchSheet({ picked, qrs = [], printed = null, sheets = {} }) {
  const mine = Object.values(sheets).filter((s) => s.code === picked);
  if (!mine.length) return { ok: false, reason: `${picked} has no approved homework sheet on this phone`, claimed: null };
  const found = qrs.filter(Boolean), ids = [...new Set(found.map((q) => q.id))];
  if (ids.length > 1) return { ok: false, reason: "The pages carry different sheet codes", claimed: found[0].code };
  if (found.length) {
    const q = found[0];
    if (q.code !== picked) return { ok: false, reason: `The page says ${q.code} but you picked ${picked}: does not match`, claimed: q.code };
    const sheet = sheets[q.id];
    if (!sheet || sheet.code !== picked) return { ok: false, reason: `Sheet ${q.id} is not an approved sheet on this phone`, claimed: q.code };
    return { ok: true, sheet, via: "qr" };
  }
  if (!printed || !printed.code) return { ok: false, reason: "No QR could be read and the printed code was not readable", claimed: null };
  if (printed.code !== picked) return { ok: false, reason: `The printed code says ${printed.code} but you picked ${picked}: does not match`, claimed: printed.code };
  const sheet = sheets[String(printed.id || "").trim()];
  if (!sheet || sheet.code !== picked) return { ok: false, reason: `The printed sheet id "${printed.id || ""}" is not an approved sheet of ${picked}`, claimed: printed.code };
  return { ok: true, sheet, via: "printed" };
}

// A homework task keeps each learner's own questions. A class task has one shared list.
export const isHomework = (t) => t?.kind === "homework";
export const questionsFor = (t, code) => (isHomework(t) ? t.perLearner?.[code]?.questions || [] : t.questions || []);
export const hwTaskId = (round) => `hw-r${round}`;
export function hwTask(round) {
  return { id: hwTaskId(round), name: `Homework round ${round}`, kind: "homework", type: "informal", round, date: "", total: 0, questions: [], perLearner: {} };
}
