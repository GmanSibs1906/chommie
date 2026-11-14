// "Caught & fixed": every self-correction in this class, in one list (Gman, 2026-11-14).
import { state, esc } from "../state.js";
import { collectFixes, fixCounts } from "../../shared/fixes.js";

const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || c;

export async function render(root, ctx) {
  const list = collectFixes(state, nameOf), n = fixCounts(list);
  const fixed = list.filter((f) => f.kind === "fixed"), held = list.filter((f) => f.kind === "held");
  const item = (f) => `<li class="fix-item" data-place="${esc(f.place)}"><p class="fix-where">${esc(f.place)} · ${esc(f.where)}</p>
    <p><span class="fix-was">${esc(f.was)}</span></p><p class="fix-now">→ ${esc(f.now)}</p>
    <p class="fix-by">Caught by ${esc(f.by)}${f.note ? ` · ${esc(f.note)}` : ""}</p></li>`;
  root.innerHTML = `
    <h1 class="v-title">Caught & fixed.</h1>
    <p class="v-lede">Chommie checks its own work. Two markers from different companies, a Reviewer from a third, and calculation instead of AI for every memo answer. Nothing below is made up: it is read from this class's marks and lessons.</p>
    <dl class="stats" style="margin-bottom:20px"><div><dt>Fixed by Chommie</dt><dd id="fix-n">${n.fixed}</dd></div><div><dt>Held for you</dt><dd id="held-n">${n.held}</dd></div></dl>
    <h2 class="list-head">Fixed</h2>
    ${fixed.length ? `<ul class="fix-list" id="fixed-list">${fixed.map(item).join("")}</ul>` : '<p class="muted">Nothing needed fixing yet. Mark some books to see the checks at work.</p>'}
    <h2 class="list-head" style="margin-top:24px">Held for you, never guessed</h2>
    ${held.length ? `<ul class="fix-list" id="held-list">${held.map(item).join("")}</ul>` : '<p class="muted">Nothing is waiting.</p>'}
    <div class="btn-row"><button class="btn btn--accent btn--big" id="to-check" type="button">Open Check</button></div>`;
  root.querySelector("#to-check").onclick = () => ctx.go("check");
}
