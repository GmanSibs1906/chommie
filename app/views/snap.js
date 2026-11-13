import { state, save, log, toast, esc } from "../state.js";
import { learners as DEFAULT_LEARNERS } from "../../shared/learners.js";
import { putPhoto, listPhotos, deletePhoto, deleteByCode } from "../db.js";

let stream = null, track = null, capture = null, sel = null, photos = [];
const MASK = 0.13; // top 13% of every page (the name strip) is blacked out on this phone before anything is stored or sent

export function ensureLearners() { if (!state.learners) { state.learners = structuredClone(DEFAULT_LEARNERS); save(); } return state.learners; }
export function leave() { stopCamera(); }
function stopCamera() { stream?.getTracks().forEach((t) => t.stop()); stream = track = capture = null; }
document.addEventListener("visibilitychange", () => { if (document.hidden && stream) { stopCamera(); document.querySelector("#cam-wrap")?.setAttribute("hidden", ""); toast("Camera stopped because you left the page"); } });

// Resize to 1280px, black out the name strip, stamp the learner code. The original image is never stored.
export async function maskAndStore(blobOrBitmap, code) {
  const bmp = blobOrBitmap instanceof Blob ? await createImageBitmap(blobOrBitmap) : blobOrBitmap;
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext("2d"); g.drawImage(bmp, 0, 0, c.width, c.height);
  const h = Math.round(c.height * MASK); g.fillStyle = "#000"; g.fillRect(0, 0, c.width, h);
  g.fillStyle = "#fff"; g.font = `600 ${Math.round(h * 0.5)}px monospace`; g.textBaseline = "middle"; g.fillText(code, 16, h / 2);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
  const id = code + "-" + Date.now();
  const page = photos.filter((p) => p.code === code).length + 1;
  await putPhoto({ id, code, page, blob, status: "queued", at: Date.now() });
  log("Snap", "Photo masked and queued", `${code} page ${page}. Name strip covered on this phone before storing.`);
  return id;
}

export async function render(root, ctx) {
  const L = ensureLearners();
  photos = await listPhotos();
  const next = L.find((l) => l.consent && !photos.some((p) => p.code === l.code));
  if (!sel || !L.some((l) => l.code === sel)) sel = (next || L.find((l) => l.consent)).code;
  draw(root, ctx);
}

function draw(root, ctx) {
  const L = state.learners, cur = L.find((l) => l.code === sel), consented = L.filter((l) => l.consent);
  const done = new Set(photos.map((p) => p.code)).size;
  root.innerHTML = `
    <h1 class="v-title">Snap the books.</h1>
    <p class="v-lede">One book after another. Only learners with signed consent can be photographed. The name strip is covered on this phone before the photo is stored, and each learner becomes a record number.</p>
    <div class="grid2">
      <div>
        <div class="panel-box">
          <div class="field"><label for="learner-sel">Learner</label>
            <select id="learner-sel" style="font:inherit;min-height:48px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);width:100%">
              ${L.map((l) => `<option value="${l.code}" ${l.code === sel ? "selected" : ""} ${l.consent ? "" : "disabled"}>${l.code} ${esc(l.name)}${l.consent ? "" : " (no consent)"}</option>`).join("")}
            </select></div>
          <p class="mono" id="snap-count" style="font-size:13px">${done} of ${consented.length} consented learners photographed</p>
          <div id="cam-wrap" hidden><video id="cam" playsinline muted autoplay style="width:100%;border-radius:14px;background:#000;max-height:60vh"></video></div>
          <div class="btn-row">
            <button class="btn btn--accent" id="cam-start" type="button">Start camera</button>
            <button class="btn" id="cam-shot" type="button" hidden>Take photo</button>
            <button class="btn btn--ghost" id="cam-torch" type="button" hidden>Torch</button>
            <button class="btn btn--ghost" id="cam-stop" type="button" hidden>Stop camera</button>
          </div>
          <p id="cam-msg" class="muted" style="font-size:14px" role="status"></p>
          <div class="btn-row">
            <label class="btn btn--ghost" style="cursor:pointer">Choose a photo instead<input type="file" id="snap-file" accept="image/*" capture="environment" class="sr-only" /></label>
            <button class="btn btn--ghost" id="snap-sample" type="button">Add sample book page (demo)</button>
          </div>
          <p class="muted" style="font-size:13px">The sample is a made-up exercise book for demo learners 6B-001 to 6B-007.</p>
        </div>
        <div class="panel-box"><h3>Upload queue</h3>
          <p id="queue-sum" class="muted">${photos.length} page(s) waiting on this phone. Photos stay here until marking, then are deleted.</p>
          <label style="display:flex;gap:10px;align-items:center;min-height:44px"><input type="checkbox" id="hold-wifi" ${state.settings.holdWifi ? "checked" : ""} style="width:22px;height:22px" /> Hold uploads until Wi-Fi</label>
          <div class="btn-row"><button class="btn btn--accent" id="go-mark" type="button" ${photos.length ? "" : "disabled"}>Mark these books</button></div>
        </div>
      </div>
      <div>
        <div class="panel-box"><h3>Photographed</h3><div id="thumbs" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px">
          ${photos.length ? "" : '<p class="muted">Nothing yet.</p>'}</div></div>
        <details class="panel-box" id="consent-reg"><summary style="cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center">Consent register (${consented.length} of ${L.length} consented)</summary>
          <p class="muted" style="font-size:14px;margin:8px 0">A parent or guardian has signed for each consented learner. Switching consent off stops photos and deletes that learner's queued pages.</p>
          <table class="tbl"><tbody>${L.map((l) => `<tr><td class="mono">${l.code}</td><td>${esc(l.name)}</td><td><label style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" data-consent="${l.code}" ${l.consent ? "checked" : ""} style="width:22px;height:22px" aria-label="Consent for ${l.code}" /> ${l.consent ? "Consent" : "Withdrawn"}</label></td></tr>`).join("")}</tbody></table></details>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  // thumbnails
  const th = $("#thumbs");
  photos.forEach((p) => { const f = document.createElement("figure"); f.style.margin = 0;
    f.innerHTML = `<img class="thumb" alt="Masked page ${p.page} for ${p.code}" width="96" height="128" style="width:100%;height:128px;object-fit:cover" src="${URL.createObjectURL(p.blob)}"><figcaption class="mono" style="font-size:11px">${p.code} p${p.page}</figcaption>`; th.appendChild(f); });
  $("#learner-sel").onchange = (e) => { sel = e.target.value; };
  $("#hold-wifi").onchange = (e) => { state.settings.holdWifi = e.target.checked; save(); };
  $("#go-mark").onclick = () => ctx.go("mark");
  root.querySelectorAll("[data-consent]").forEach((cb) => cb.onchange = async () => {
    const l = state.learners.find((x) => x.code === cb.dataset.consent); l.consent = cb.checked;
    if (!cb.checked) { await deleteByCode(l.code); photos = await listPhotos(); }
    log("Teacher", cb.checked ? "Consent recorded" : "Consent withdrawn", `${l.code}${cb.checked ? "" : ": queued photos deleted"}`); save();
    if (sel === l.code && !cb.checked) sel = (state.learners.find((x) => x.consent) || {}).code;
    draw(root, ctx); root.querySelector("#consent-reg").open = true;
  });

  const guard = () => { const l = state.learners.find((x) => x.code === sel); if (!l?.consent) { toast("No signed consent for " + sel + ". Not photographed."); return null; } return l; };
  async function added(code) {
    photos = await listPhotos();
    const nx = state.learners.find((l) => l.consent && !photos.some((p) => p.code === l.code));
    if (nx) sel = nx.code;
    const wasOpen = !!stream; draw(root, ctx);
    if (wasOpen) restoreCamera(root);
    toast("Saved " + code + " (name covered)");
  }
  $("#snap-file").onchange = async (e) => { const l = guard(); const f = e.target.files[0]; if (!l || !f) return; await maskAndStore(f, l.code); added(l.code); };
  $("#snap-sample").onclick = async () => {
    const l = guard(); if (!l) return;
    const n = Number(l.code.slice(-3)); const code = n >= 1 && n <= 7 ? l.code : "6B-001";
    if (code !== l.code) toast("Sample book pages exist for 6B-001 to 6B-007, using 6B-001's pages");
    const blob = await (await fetch(`../demo/books/${code}.jpg`)).blob(); await maskAndStore(blob, l.code); added(l.code);
  };
  // camera
  $("#cam-start").onclick = async () => {
    const msg = $("#cam-msg");
    if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = "This browser has no camera access. Use 'Choose a photo instead'."; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      attach(root);
    } catch (e) { msg.textContent = "Camera not available (" + (e.name || "error") + "). Use 'Choose a photo instead'."; }
  };
  $("#cam-stop").onclick = () => { stopCamera(); draw(root, ctx); };
  $("#cam-shot").onclick = async () => {
    const l = guard(); if (!l || !stream) return;
    try {
      let src;
      if (capture) { src = await capture.takePhoto(); }            // Chrome and Samsung Internet
      else { const v = root.querySelector("#cam"); const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); src = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.92)); } // iOS Safari: video to canvas
      await maskAndStore(src, l.code); added(l.code);
    } catch (e) { toast("Could not take the photo: " + e.message); }
  };
}
function restoreCamera(root) { if (stream) attach(root); }
function attach(root) {
  const $ = (s) => root.querySelector(s);
  track = stream.getVideoTracks()[0];
  capture = window.ImageCapture ? new ImageCapture(track) : null;
  $("#cam").srcObject = stream; $("#cam-wrap").hidden = false;
  $("#cam-start").hidden = true; $("#cam-shot").hidden = false; $("#cam-stop").hidden = false;
  const caps = track.getCapabilities ? track.getCapabilities() : {};
  if (caps.torch) { const t = $("#cam-torch"); t.hidden = false; let on = false; t.onclick = async () => { on = !on; await track.applyConstraints({ advanced: [{ torch: on }] }); t.textContent = on ? "Torch off" : "Torch"; }; }
  $("#cam-msg").textContent = capture ? "Camera on (photo mode)." : "Camera on (frame capture mode).";
}
