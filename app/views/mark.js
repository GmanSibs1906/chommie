import { state, save, log, toast, esc } from "../state.js";
import { listPhotos, kindOf } from "../db.js";
import { getTasks, markAll, markHomeworkAll } from "../orchestrator.js";
import { ensureLearners } from "./snap.js";
import { finalCorrect, scoreLearner } from "../../shared/marking.js";
import { isHomework } from "../../shared/hwmark.js";

let progress = {}, running = false;
const nameOf = (c) => (state.learners || []).find((l) => l.code === c)?.name || "";
const tick = (it) => { const f = finalCorrect(it); return f === true ? '<b class="tick">✓</b>' : f === false ? '<b class="tick tick--x">✗</b>' : it.status === "unclear" ? '<b class="tick" style="color:#8a6100">?</b>' : '<b class="tick" style="color:#8a6100">!</b>'; };

export async function render(root, ctx) {
  ensureLearners();
  if (state.markKind === "homework") return drawHw(root, ctx);
  const task = getTasks()[0];
  const photos = (await listPhotos()).filter((p) => p.status === "queued" && kindOf(p) === "class"), codes = [...new Set(photos.map((p) => p.code))].sort();
  draw(root, ctx, task, codes);
}
function draw(root, ctx, task, codes) {
  const marks = state.marks[task.id] || {}, all = [...new Set([...codes, ...Object.keys(marks)])].sort();
  const conn = navigator.connection, onWifi = !conn || conn.type === "wifi" || conn.type === undefined;
  const held = state.settings.holdWifi && !onWifi && !state.sendNow, offline = navigator.onLine === false;
  root.innerHTML = `
    <h1 class="v-title">Two markers read every book.</h1>
    <p class="v-lede">${esc(task.name)}, ${task.total} questions, <span id="task-type">${task.type === "formal" ? "formal task (recorded)" : "informal task (not formally recorded)"}</span>. Marker A (Anthropic) and Marker B (Google) read each learner's pages in one request. Anything unclear is never guessed: it waits for you.</p>
    ${kindPick()}
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
  wireKind(root, ctx);
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

// ---- What are you marking? ----
function kindPick() {
  const hw = state.markKind === "homework";
  return `<fieldset class="kind-pick" id="mark-kind"><legend>What are you marking?</legend>
    <label class="kind-opt"><input type="radio" name="markkind" value="class" ${hw ? "" : "checked"}> <span>Class task</span></label>
    <label class="kind-opt"><input type="radio" name="markkind" value="homework" ${hw ? "checked" : ""}> <span>Personal homework</span></label></fieldset>`;
}
function wireKind(root, ctx) {
  root.querySelectorAll("[name=markkind]").forEach((r) => r.onchange = () => { state.markKind = r.value; log("Teacher", "Chose what to mark", r.value === "homework" ? "Personal homework" : "Class task"); save(); ctx.go("mark"); });
}

// ---- Personal homework: every page is matched to a learner and to that learner's own sheet before it is marked ----
async function drawHw(root, ctx) {
  const photos = (await listPhotos()).filter((p) => kindOf(p) === "homework");
  const queued = photos.filter((p) => p.status === "queued"), held = photos.filter((p) => p.status === "held");
  const hwTasks = getTasks().filter(isHomework);
  const codes = [...new Set([...queued.map((p) => p.code), ...held.map((p) => p.code), ...hwTasks.flatMap((t) => Object.keys(state.marks[t.id] || {}))])].sort();
  const queuedCodes = [...new Set(queued.map((p) => p.code))].sort();
  const offline = navigator.onLine === false, conn = navigator.connection, onWifi = !conn || conn.type === "wifi" || conn.type === undefined;
  const heldBack = state.settings.holdWifi && !onWifi && !state.sendNow;
  root.innerHTML = `
    <h1 class="v-title">Each learner is marked against their own sheet.</h1>
    <p class="v-lede">Homework is informal: it feeds the heat map and the next homework round, and is not recorded. Every page must match the learner you picked and the code and QR printed on the sheet. If they disagree, or that learner has no approved sheet, the page is not marked: it waits for you in Check.</p>
    ${kindPick()}
    <div class="panel-box">
      ${offline ? '<p class="notice notice--bad" role="status">You are offline. Photos are safe on this phone and will go when you are back online.</p>' : heldBack ? '<p class="notice" role="status">Holding uploads until Wi-Fi.</p>' : ""}
      <div class="btn-row">
        <button class="btn btn--accent" id="run" type="button" ${running || !queuedCodes.length || offline || heldBack ? "disabled" : ""}>${running ? "Marking" : queuedCodes.length ? `Mark ${queuedCodes.length} homework book${queuedCodes.length > 1 ? "s" : ""}` : "No homework pages queued"}</button>
        ${!queuedCodes.length ? '<button class="btn btn--ghost" id="to-snap" type="button">Snap homework</button>' : ""}
        ${hwTasks.some((t) => Object.keys(state.marks[t.id] || {}).length) || held.length ? '<button class="btn btn--ghost" id="to-check" type="button">Go to Check</button>' : ""}
      </div></div>
    <div class="panel-box"><h3>Homework books</h3>
      ${codes.length ? `<table class="tbl" id="mark-table"><thead><tr><th>Learner</th><th>Sheet and answers</th><th>Score</th><th>Status</th></tr></thead><tbody>
        ${codes.map((c) => {
          const rows = hwTasks.map((t) => [t, (state.marks[t.id] || {})[c]]).filter(([, m]) => m);
          const hd = held.filter((p) => p.code === c), p = progress[c];
          const out = rows.map(([t, m]) => { const sc = scoreLearner(m.items), q = t.perLearner[c]?.questions?.length || m.items.length;
            return `<tr data-code="${c}" data-task="${t.id}"><td class="mono">${c}<br><span class="muted">${esc(nameOf(c))}</span></td>
              <td><span class="mono" style="font-size:13px">${esc(t.name)}, sheet ${esc(m.sheetId || "")}, ${q} questions</span><br><span class="book-ticks" style="display:flex;gap:4px;flex-wrap:wrap">${m.items.map(tick).join("")}</span></td>
              <td class="mono">${sc.right}/${sc.total}${sc.pending ? `<br><span class="st st--warn">${sc.pending} need you</span>` : ""}</td>
              <td><span class="st ${sc.pending ? "st--warn" : "st--ok"}">${sc.pending ? "Waiting for you" : "Both agree"}</span></td></tr>`; });
          if (hd.length) out.push(`<tr data-code="${c}" data-held="1"><td class="mono">${c}<br><span class="muted">${esc(nameOf(c))}</span></td><td colspan="2">${hd.length} page${hd.length > 1 ? "s" : ""} not marked.<br><span class="muted" style="font-size:13px">${esc(hd[0].holdReason || "")}</span></td><td><span class="st st--warn">Held in Check</span></td></tr>`);
          if (!rows.length && !hd.length) out.push(`<tr data-code="${c}"><td class="mono">${c}<br><span class="muted">${esc(nameOf(c))}</span></td><td colspan="2" class="muted">Waiting</td><td class="${p && /error/.test(p) ? "st st--bad" : "loading"}">${esc(p || "Queued")}</td></tr>`);
          return out.join(""); }).join("")}
      </tbody></table>` : '<p class="muted">Snap some homework sheets first.</p>'}</div>`;
  const $ = (x) => root.querySelector(x);
  wireKind(root, ctx);
  const ts = $("#to-snap"); if (ts) ts.onclick = () => ctx.go("snap");
  const tc = $("#to-check"); if (tc) tc.onclick = () => ctx.go("check");
  const run = $("#run"); if (run) run.onclick = async () => {
    running = true; progress = {}; drawHw(root, ctx);
    await markHomeworkAll(queuedCodes, (c, m) => { progress[c] = m; if (root.isConnected) drawHw(root, ctx); });
    running = false; if (root.isConnected) drawHw(root, ctx);
    toast("Marking finished. Open Check for anything that needs you.");
  };
}
