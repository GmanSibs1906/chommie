// Copies only the public site into dist/ (never .albert, planning, design, tests).
import { cpSync, rmSync, mkdirSync, readdirSync } from "node:fs";
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const f of readdirSync(".")) {
  if (/\.(html|css|js|jpg|png|webmanifest)$/.test(f) && f !== "package.json") cpSync(f, "dist/" + f);
}
for (const d of ["fonts", "app", "shared", "demo"]) cpSync(d, "dist/" + d, { recursive: true });
console.log("dist ready");
