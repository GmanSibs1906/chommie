// "Caught & fixed": every self-correction in this class, in one list (Gman, 2026-11-14). Each marking card shows the
// cropped answer from the learner's photo; tap it to see it large, or the whole page.
import { state, esc } from "../state.js";
import { listPhotos, kindOf } from "../db.js";
import { cropAnswer } from "../crop.js";
import { collectFixes, fixCounts } from "../../shared/fixes.js";

const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || c;

export async function render(root, ctx) {
  const list = collectFixes(state, nameOf), n = fixCounts(list);
  const fixed = list.filter((f) => f.kind === "fixed"), held = list.filter((f) => f.kind === "held");
  const item = (f) => { const i = list.indexOf(f); return `<li class="fix-item" data-place="${esc(f.place)}">
    ${f.pic ? `<div class="fix-pic" data-pic="${i}"><p class="muted" style="font-size:12px;margin:0">Loading the photo…</p></div>` : ""}
    <div class="fix-body"><p class="fix-where">${esc(f.place)} · ${esc(f.where)}</p>
    <p><span class="fix-was">${esc(f.was)}</span></p><p class="fix-now">→ ${esc(f.now)}</p>
    <p class="fix-by">Caught by ${esc(f.by)}${f.note ? ` · ${esc(f.note)}` : ""}</p></div></li>`; };
  root.innerHTML = `
    <h1 class="v-title">Caught & fixed.</h1>
    <p class="v-lede">Chommie checks its own work. Two markers from different companies, a Reviewer from a third, and calculation instead of AI for every memo answer. Nothing below is made up: it is read from this class's marks and lessons. Tap a photo to see it large.</p>
    <dl class="stats" style="margin-bottom:20px"><div><dt>Fixed</dt><dd id="fix-n">${n.fixed}</dd></div><div><dt>Waiting for you</dt><dd id="held-n">${n.held}</dd></div></dl>
    <h2 class="list-head">Waiting for you, never guessed</h2>
    ${held.length ? `<ul class="fix-list" id="held-list">${held.map(item).join("")}</ul>` : '<p class="muted">Nothing is waiting.</p>'}
    <h2 class="list-head" style="margin-top:24px">Fixed</h2>
    ${fixed.length ? `<ul class="fix-list" id="fixed-list">${fixed.map(item).join("")}</ul>` : '<p class="muted">Nothing fixed yet. Decide the items above in Check, or mark some books.</p>'}
    <div class="btn-row"><button class="btn btn--accent btn--big" id="to-check" type="button">Open Check to decide</button></div>
    <dialog class="pic-dialog" id="pic-dialog" aria-label="Photo of the answer">
      <div class="pic-dialog-bar"><p class="mono" id="pic-title" style="margin:0;font-size:13px"></p>
        <div class="btn-row" style="margin:0"><button class="btn btn--ghost" id="pic-whole" type="button">Whole page</button><button class="btn" id="pic-close" type="button">Close</button></div></div>
      <img id="pic-img" alt="" />
    </dialog>`;
  root.querySelector("#to-check").onclick = () => ctx.go("check");

  // Lightbox
  const dlg = root.querySelector("#pic-dialog"), img = root.querySelector("#pic-img"), title = root.querySelector("#pic-title"), whole = root.querySelector("#pic-whole");
  let cur = null;
  const show = (src, alt, t) => { img.src = src; img.alt = alt; title.textContent = t; if (!dlg.open) dlg.showModal(); };
  root.querySelector("#pic-close").onclick = () => dlg.close();
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // tap outside the photo closes it
  whole.onclick = () => { if (!cur) return; const on = whole.dataset.on === "1";
    whole.dataset.on = on ? "" : "1"; whole.textContent = on ? "Whole page" : "Just the answer";
    show(on ? cur.crop : cur.page, cur.alt, cur.title); };

  // Photos: cropped to the answer when a marker said where it is, else the whole page. Deleted after marks are confirmed.
  let photos = []; try { photos = await listPhotos(); } catch {}
  for (const f of list) {
    if (!f.pic) continue;
    const holder = root.querySelector(`[data-pic="${list.indexOf(f)}"]`); if (!holder) continue;
    const pg = photos.filter((x) => x.code === f.pic.code && kindOf(x) === (f.pic.homework ? "homework" : "class") && x.status !== "held").sort((a, b) => a.page - b.page);
    const photo = pg[f.pic.page - 1] || pg[0];
    if (!photo) { holder.innerHTML = '<p class="muted" style="font-size:12px;margin:0">Photo deleted after the marks were confirmed.</p>'; continue; }
    const c = await cropAnswer(photo.blob, f.pic.box), page = URL.createObjectURL(photo.blob);
    const alt = `${c.cropped ? "Answer" : "Page"} of ${nameOf(f.pic.code)}, question ${f.pic.n}`, t = `${nameOf(f.pic.code)} · question ${f.pic.n}`;
    holder.innerHTML = `<button type="button" class="pic-btn" aria-label="Show larger: ${esc(alt)}"><img src="${c.url}" alt="${esc(alt)}" /></button>
      <p class="muted" style="font-size:12px;margin:4px 0 0">${c.cropped ? "Cropped to the answer · tap to enlarge" : "Whole page · tap to enlarge"}</p>`;
    holder.querySelector(".pic-btn").onclick = () => { cur = { crop: c.url, page, alt, title: t }; whole.dataset.on = ""; whole.textContent = "Whole page"; show(c.url, alt, t); };
  }
}
