// Local test server only: serves the repo and answers /api/write-bank with the code-made bank, so browser checks do not
// need the model key. Every other /api route returns 503 (the real functions run only on the deployed site).
import { createServer } from "node:http"; import { readFileSync, existsSync, statSync } from "node:fs"; import { extname, join } from "node:path";
import { codeBank } from "../shared/homework.js";
const T = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff" };
createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/api/write-bank") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ bank: codeBank("devserver"), meta: null })); }
  if (u.startsWith("/api/")) { res.writeHead(503, { "content-type": "application/json" }); return res.end('{"error":"not available on the local test server"}'); }
  let f = join(process.cwd(), u); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!existsSync(f)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": T[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(8899, () => console.log("dev server on 8899"));
