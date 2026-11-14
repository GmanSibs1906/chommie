// PDF text, rebuilt in reading order so the columns of an ATP table (WEEK 1, WEEK 2 ...) stay lined up with their topics and hours.
import { getDocumentProxy } from "unpdf";

export async function pdfPages(buf) {
  const pdf = await getDocumentProxy(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const tc = await (await pdf.getPage(n)).getTextContent();
    pages.push(layoutText(tc.items));
  }
  return pages;
}

// Group text items into lines by y (top to bottom), sort each line by x, and mark big horizontal gaps as column breaks " | ".
export function layoutText(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = it.transform[5], x = it.transform[4];
    let row = rows.find((r) => Math.abs(r.y - y) <= 2.5);
    if (!row) { row = { y, cells: [] }; rows.push(row); }
    row.cells.push({ x, w: it.width || 0, s: it.str });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.cells.sort((a, b) => a.x - b.x);
    let out = "", end = null;
    for (const c of r.cells) {
      if (end !== null) out += c.x - end > 14 ? " | " : (c.x - end > 1.5 && !out.endsWith(" ") && !c.s.startsWith(" ") ? " " : "");
      out += c.s; end = c.x + c.w;
    }
    return out.replace(/[ \t]+/g, " ").trim();
  }).filter(Boolean).join("\n");
}

// Pages of one term. Each DBE ATP page is headed "... (TERM n)". A whole-year file is cut to that term's pages;
// a one-term file, or one with no readable term headings, is returned whole.
export function termSection(pages, term) {
  const head = (p) => { const m = p.slice(0, 400).match(/\(?\bTERM\s*([1-4])\b\)?/i); return m ? Number(m[1]) : null; };
  const tags = pages.map(head);
  if (!tags.some(Boolean)) return pages;
  const out = []; let cur = null;
  pages.forEach((p, i) => { if (tags[i]) cur = tags[i]; if (cur === Number(term)) out.push(p); });
  return out.length ? out : pages;
}
export const capText = (pages, max = 24000) => pages.join("\n\n--- next page ---\n\n").slice(0, max);
