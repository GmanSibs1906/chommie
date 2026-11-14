// Reads the homework QR from the ORIGINAL photo, before the name strip is covered. BarcodeDetector where the phone has it, jsQR otherwise.
import jsQR from "../shared/vendor/jsqr.mjs";
import { parseQr } from "../shared/hwmark.js";

export async function readQr(bmp) {
  try {
    if (window.BarcodeDetector) {
      const d = new BarcodeDetector({ formats: ["qr_code"] });
      for (const x of await d.detect(bmp)) { const q = parseQr(x.rawValue); if (q) return q; }
    }
  } catch { /* fall through to jsQR */ }
  for (const max of [1600, 1000, 640]) {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(bmp, 0, 0, w, h);
    const r = jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
    const q = r && parseQr(r.data); if (q) return q;
  }
  return null;
}
