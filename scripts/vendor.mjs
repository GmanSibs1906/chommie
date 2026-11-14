// Copies the two QR libraries (MIT) into shared/vendor/ as ES modules so the browser and node --test use the same code.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
mkdirSync("shared/vendor", { recursive: true });
const js = readFileSync("node_modules/jsqr/dist/jsQR.js", "utf8");
writeFileSync("shared/vendor/jsqr.mjs", `// jsQR (MIT, Cosmo Wolfe), wrapped as an ES module by scripts/vendor.mjs\nconst module = { exports: {} }; const exports = module.exports;\n${js}\nexport default module.exports;\n`);
writeFileSync("shared/vendor/qrcode.mjs", readFileSync("node_modules/qrcode-generator/dist/qrcode.mjs", "utf8"));
console.log("vendor ready");
