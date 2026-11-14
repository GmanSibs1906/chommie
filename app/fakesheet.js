// Demo only: draws a made-up FILLED-IN homework sheet (name strip, big code, QR, questions, handwriting) so the stage path and the
// tests can show personal-homework marking without a camera. It goes through the normal maskAndStore path, like a real photo.
import { state } from "./state.js";
import { qrPayload, qrMatrix } from "../shared/hwmark.js";

const wrongOf = (a) => {
  let m;
  if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(a))) return `${+m[1] + 1} ${m[2]}/${m[3]}`;
  if ((m = /^(\d+)\/(\d+)$/.exec(a))) return `${+m[1] + 1}/${m[2]}`;
  return String(Number(a) + 1);
};

// sheetCode: whose sheet is drawn. wrong: question numbers answered wrongly. qr: print the QR or leave it torn off.
export async function drawSheet({ sheetCode, wrong = [], qr = true, tilt = 0.012 }) {
  const sheet = Object.values(state.hwSheets || {}).filter((s) => s.code === sheetCode).sort((a, b) => b.round - a.round)[0];
  if (!sheet) throw new Error("No approved sheet for " + sheetCode);
  const name = (state.learners || []).find((l) => l.code === sheetCode)?.name || "";
  const W = 820, H = 1160, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"); g.fillStyle = "#6b6b66"; g.fillRect(0, 0, W, H);
  g.translate(W / 2, H / 2); g.rotate(tilt); g.translate(-W / 2, -H / 2);
  g.fillStyle = "#fbfaf6"; g.fillRect(14, 14, W - 28, H - 28);
  g.fillStyle = "#111"; g.textBaseline = "alphabetic";
  g.font = "20px Arial"; g.fillText(`Grade 6B Mathematics, Term 4. Fractions homework, round ${sheet.round}.`, 50, 70);
  g.font = "34px Georgia"; g.fillText(name, 50, 130);
  const top = 190; g.fillRect(50, top, W - 100, 3); g.fillRect(50, top + 150, W - 100, 3);
  g.font = "700 74px monospace"; g.fillText(sheetCode, 56, top + 90);
  g.font = "18px Arial"; g.fillText(`Homework round ${sheet.round}`, 58, top + 128);
  if (qr) {
    const { size, dark } = qrMatrix(qrPayload(sheetCode, sheet.id)), q = 4, quiet = 2, side = (size + quiet * 2) * q, x0 = W - 50 - side - 6, y0 = top + 8;
    g.fillStyle = "#fff"; g.fillRect(x0, y0, side, side); g.fillStyle = "#000";
    for (let r = 0; r < size; r++) for (let k = 0; k < size; k++) if (dark(r, k)) g.fillRect(x0 + (k + quiet) * q, y0 + (r + quiet) * q, q, q);
  }
  const qs = sheet.questions, y1 = top + 220, gap = Math.min(66, (H - 120 - y1) / qs.length);
  qs.forEach((q, i) => {
    const y = y1 + i * gap, w = wrong.includes(q.n);
    g.fillStyle = "#111"; g.font = "26px Arial"; g.fillText(`${q.n}.  ${q.plain}${/\?\/\d+$/.test(q.plain) ? "" : "  ="}`, 60, y);
    g.fillRect(60, y + 10, W - 120, 1);
    g.fillStyle = "#16225c"; g.font = "bold 36px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive"; g.fillText(w ? wrongOf(q.answer) : q.answer, 470, y - 2);
  });
  g.fillStyle = "#333"; g.font = "bold 22px monospace"; g.fillText(`Sheet ${sheet.id} | ${sheetCode}`, 50, H - 40);
  return new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
}
// Scenarios the Snap button offers.
export const SCENARIOS = {
  right: "Right sheet, all answers right", onewrong: "Right sheet, one wrong answer",
  wrongcode: "Another learner's sheet (wrong code)", noqr: "QR torn off (printed code only)",
};
export async function fakeFor(picked, scenario) {
  const have = [...new Set(Object.values(state.hwSheets || {}).map((s) => s.code))].sort();
  const other = have.find((c) => c !== picked);
  if (scenario === "wrongcode") { if (!other) throw new Error("Approve homework for at least two learners first"); return drawSheet({ sheetCode: other, wrong: [] }); }
  if (!have.includes(picked)) throw new Error(`${picked} has no approved sheet. Approve homework first, or pick another learner.`);
  const n = (Object.values(state.hwSheets).find((s) => s.code === picked).questions[1] || {}).n || 2;
  return drawSheet({ sheetCode: picked, wrong: scenario === "onewrong" ? [n] : [], qr: scenario !== "noqr" });
}
