import { state, save, log, toast, esc } from "../state.js";
import { listPhotos } from "../db.js";
import { getTasks, markAll } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { finalCorrect, scoreLearner } from "../../shared/marking.js";

let progress = {}, running = false;
const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || "";
const tick = (it) => { const f = finalCorrect(it); return f === true ? '<b class="tick">✓</b>' : f === false ? '<b class="tick tick--x">✗</b>' : it.status === "unclear" ? '<b class="tick" style="color:#8a6100">?</b>' : '<b class="tick" style="color:#8a6100">!</b>'; };

export async function render(root, ctx) {
  ensureLearners(); const task = getTasks()[0];
  const photos = (await listPhotos()).filter((p) => p.status === "queued"), codes = [...new Set(photos.map((p) => p.code))].sort();
  draw(root, ctx, task, codes);
}
function draw(root, ctx, task, codes) {
  const marks = state.marks[task.id] || {}, all = [...new Set([...codes, ...Object.keys(marks)])].sort();
  const conn = navigator.connection, onWifi = !conn || conn.type === "wifi" || conn.type === undefined;
  const held = state.settings.holdWifi && !onWifi && !state.sendNow, offline = navigator.onLine === false;
  root.innerHTML = `
    <h1 class="v-title">Two markers read every book.</h1>
    <p class="v-lede">${esc(task.name)}, ${task.total} questions, <span id="task-type">${task.type === "formal" ? "formal task (recorded)" : "informal task (not formally recorded)"}</span>. Marker A (Anthropic) and Marker B (Google) read each learner's pages in one request. Anything unclear is never guessed: it waits for you.</p>
    <div class="panel-box">
      <div class="field-inline"><label for="task-type-sel">This task is</label>
        <select id="task-type-sel" style="font:inherit;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface)"><option value="informal" ${task.type === "informal" ? "selected" : ""}>Informal (feeds the struggling view only)</option><option value="formal" ${task.type === "formal" ? "selected" : ""}>Formal (recorded and moderated)</option></select></div>
      ${offline ? '<p class="notice notice--bad" role="status" style="margin-top:12px">You are offline. Photos are safe on this phone and will go when you are back online.</p>' : held ? '<p class="notice" role="status" style="margin-top:12px">Holding uploads until Wi-Fi.</p>' : ""}
      <div class="btn-row">
        <button class="btn btn--accent" id="run" type="button" ${running || !codes.length || offline || held ? "disabled" : ""}>${running ? "Marking" : codes.length ? `Mark ${codes.length} book${codes.length > 1 ? "s" : ""}` : "No books queued"}</button>
        ${held ? '<button class="btn btn--ghost" id="send-now" type="button">Send now</button>' : ""}
        ${!codes.length ? '<button class="btn btn--ghost" id="to-snap" type="button">Snap books</button>' : ""}
        ${Object.keys(marks).length ? '<button class="btn btn--ghost" id="to-check" type="button">Go to Check</button>' : ""}
      </div></div>
    <div class="panel-box"><h3>Books</h3>
      ${all.length ? `<table class="tbl" id="mark-table"><thead><tr><th>Learner</th><th>Answers</th><th>Score</th><th>Status</th></tr></thead><tbody>
        ${all.map((c) => { const m = marks[c], p = progress[c];
          if (!m) return `<tr data-code="${c}"><td class="mono">${c}<br><span class="muted">${esc(nameOf(c))}</span></td><td colspan="2" class="muted">Waiting</td><td class="${p && /error/.test(p) ? "st st--bad" : "loading"}">${esc(p || "Queued")}</td></tr>`;
          const s = scoreLearner(m.items), agree = m.items.filter((i) => i.status === "agree").length;
          return `<tr data-code="${c}"><td class="mono">${c}<br><span class="muted">${esc(nameOf(c))}</span></td>
            <td><span class="book-ticks" style="display:flex;gap:4px;flex-wrap:wrap">${m.items.map(tick).join("")}</span></td>
            <td class="mono">${s.right}/${s.total}${s.pending ? `<br><span class="st st--warn">${s.pending} need you</span>` : ""}</td>
            <td><span class="st ${s.pending ? "st--warn" : "st--ok"}">${s.pending ? "Waiting for you" : "Both agree"}</span><br><span class="muted" style="font-size:13px">${agree} of ${m.items.length} agreed</span></td></tr>`; }).join("")}
      </tbody></table>` : '<p class="muted">Snap some books first.</p>'}</div>`;
  const $ = (s) => root.querySelector(s);
  $("#task-type-sel").onchange = (e) => { task.type = e.target.value; log("Teacher", "Task type set", `${task.name} is ${task.type}`); save(); draw(root, ctx, task, codes); };
  const sn = $("#send-now"); if (sn) sn.onclick = () => { state.sendNow = true; draw(root, ctx, task, codes); };
  const ts = $("#to-snap"); if (ts) ts.onclick = () => ctx.go("snap");
  const tc = $("#to-check"); if (tc) tc.onclick = () => ctx.go("check");
  const run = $("#run"); if (run) run.onclick = async () => {
    running = true; progress = {}; draw(root, ctx, task, codes);
    await markAll(task, codes, (c, m) => { progress[c] = m; if (root.isConnected) draw(root, ctx, task, codes); });
    running = false; if (root.isConnected) draw(root, ctx, task, codes);
    toast("Marking finished. Open Check for anything that needs you.");
  };
}
