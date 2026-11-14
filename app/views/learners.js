import { state, save, log, api, toast, esc, activeClass } from "../state.js";
import { deleteByCode } from "../db.js";
import { fileToJpeg } from "../image.js";
import { busy, idle } from "../agents.js";

export const classPrefix = () => (activeClass()?.name || "C").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "C";
export function addLearner(first, surname) {
  const pre = classPrefix(), nums = state.learners.map((l) => Number(String(l.code).split("-").pop()) || 0);
  const code = `${pre}-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
  state.learners.push({ code, name: `${first.trim()} ${surname.trim()}`.trim(), consent: true });
  return code;
}
let draft = null; // names read from a photo, waiting for the teacher to confirm

export async function render(root, ctx) {
  state.learners ||= []; draw(root, ctx);
}
function draw(root, ctx) {
  const L = state.learners;
  root.innerHTML = `
    <h1 class="v-title">Your learners.</h1>
    <p class="v-lede">${L.length ? `${L.length} learner${L.length === 1 ? "" : "s"} in ${esc(activeClass().name)}.` : "No learners yet. Type a name, or photograph your class list."}</p>
    <div class="grid2">
      <div>
        <form class="panel-box" id="add-form" novalidate><h3>Add a learner</h3>
          <div class="field"><label for="l-first">First name</label><input id="l-first" autocomplete="off" /></div>
          <div class="field"><label for="l-last">Surname</label><input id="l-last" autocomplete="off" /></div>
          <p class="notice notice--bad" id="add-err" role="alert" hidden>Type a first name and a surname.</p>
          <button class="btn btn--accent btn--big" id="add-btn" type="submit">Add learner</button></form>
        <div class="panel-box"><h3>Photo of a class list</h3>
          <p class="muted">Chommie reads the names. You check and fix them before they are added. The photo is read by an AI service outside South Africa, so use made-up names for the demo.</p>
          <label class="btn btn--ghost btn--big" for="list-file" style="cursor:pointer">Take or choose a photo</label>
          <input type="file" id="list-file" accept="image/*" class="sr-only" />
          <div class="btn-row"><button class="btn btn--ghost btn--big" id="list-sample" type="button">Use the sample class list (demo)</button></div>
          <div id="draft"></div>
        </div>
      </div>
      <div class="panel-box"><h3>Class list</h3>
        ${L.length ? `<ul class="learner-list" id="learner-list">${L.map((l) => `<li data-code="${esc(l.code)}"><div><span class="mono">${esc(l.code)}</span><br><strong>${esc(l.name)}</strong></div>
          <label class="consent"><input type="checkbox" data-consent="${esc(l.code)}" ${l.consent ? "checked" : ""} aria-label="Consent for ${esc(l.code)}" /> <span>${l.consent ? "Consent" : "Withdrawn"}</span></label>
          <button class="btn btn--ghost" data-rm="${esc(l.code)}" type="button" aria-label="Remove ${esc(l.name)}">Remove</button></li>`).join("")}</ul>
          <p class="muted" style="font-size:15px;margin-top:10px">Consent means a parent or guardian has signed. Switching it off stops photos of that learner and deletes any waiting pages.</p>`
          : '<p class="muted">Nobody yet.</p>'}
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  $("#add-form").onsubmit = (e) => {
    e.preventDefault();
    const f = $("#l-first").value.trim(), s = $("#l-last").value.trim();
    if (!f || !s) { $("#add-err").hidden = false; return; }
    const code = addLearner(f, s); log("Teacher", "Added a learner", code); save(); toast(`Added ${f} ${s}`); draw(root, ctx);
    root.querySelector("#l-first").focus();
  };
  root.querySelectorAll("[data-consent]").forEach((cb) => cb.onchange = async () => {
    const l = L.find((x) => x.code === cb.dataset.consent); l.consent = cb.checked;
    if (!cb.checked) await deleteByCode(l.code);
    log("Teacher", cb.checked ? "Consent recorded" : "Consent withdrawn", l.code + (cb.checked ? "" : ": queued photos deleted")); save(); draw(root, ctx);
  });
  root.querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => {
    const i = L.findIndex((x) => x.code === b.dataset.rm); if (i < 0) return;
    await deleteByCode(L[i].code); log("Teacher", "Removed a learner", L[i].code); L.splice(i, 1); save(); draw(root, ctx);
  });
  async function readList(blobOrFile) {
    busy("Curriculum Reader is reading your class list");
    $("#draft").innerHTML = `<p class="loading" role="status">Curriculum Reader is reading the class list</p>`;
    try {
      const r = await api("/api/read-names", { images: [await fileToJpeg(blobOrFile)] });
      draft = r.names; log("Curriculum Reader", "Read a class list", `${r.names.length} names for the teacher to confirm`, r.meta); save();
      idle(`Curriculum Reader read ${r.names.length} names. Check them below.`); drawDraft();
    } catch (e) { idle(); $("#draft").innerHTML = `<p class="notice notice--bad" role="alert">${esc(e.message)}</p>`; }
  }
  function drawDraft() {
    const d = $("#draft"); if (!draft) { d.innerHTML = ""; return; }
    d.innerHTML = `<h4 style="margin:16px 0 8px">Check the names</h4><div id="draft-rows">${draft.map((n, i) => `<div class="draft-row" data-i="${i}">
      <input aria-label="First name ${i + 1}" data-f="first" value="${esc(n.first)}" /><input aria-label="Surname ${i + 1}" data-f="surname" value="${esc(n.surname)}" />
      <button class="btn btn--ghost" data-del="${i}" type="button" aria-label="Remove name ${i + 1}">Remove</button>${n.unclear ? '<span class="st st--warn">please check</span>' : ""}</div>`).join("")}</div>
      <div class="btn-row"><button class="btn btn--accent btn--big" id="confirm-names" type="button">Add these ${draft.length} learners</button><button class="btn btn--ghost btn--big" id="cancel-names" type="button">Cancel</button></div>`;
    d.querySelectorAll(".draft-row input").forEach((inp) => inp.oninput = () => { draft[Number(inp.closest(".draft-row").dataset.i)][inp.dataset.f] = inp.value; });
    d.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { draft.splice(Number(b.dataset.del), 1); drawDraft(); });
    d.querySelector("#cancel-names").onclick = () => { draft = null; drawDraft(); };
    d.querySelector("#confirm-names").onclick = () => {
      const ok = draft.filter((n) => (n.first + n.surname).trim());
      ok.forEach((n) => addLearner(n.first, n.surname)); log("Teacher", "Confirmed class list", `${ok.length} learners added after checking the names`); draft = null; save(); toast(`Added ${ok.length} learners`); draw(root, ctx);
    };
  }
  if (draft) drawDraft();
  $("#list-file").onchange = (e) => { const f = e.target.files[0]; if (f) readList(f); };
  $("#list-sample").onclick = async () => readList(await (await fetch("../demo/class-list-6b.jpg")).blob());
}
