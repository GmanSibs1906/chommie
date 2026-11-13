import { state, save, log, api, toast, esc } from "../state.js";
import { checkAgainstCaps } from "../../shared/caps.js";
import { fileToJpeg } from "../image.js";

let caps, official;
async function load() {
  caps ||= await (await fetch("../shared/caps-g6-t4.json")).json();
  official ||= await (await fetch("../shared/official-atp-g6-t4.json")).json();
}
const STATUS = { matched: ["In CAPS", "ok"], extra: ["Not in CAPS, will not be used", "bad"], assessment: ["Assessment week", "na"] };

export async function render(root, ctx) {
  await load();
  root.innerHTML = `
    <h1 class="v-title">Drop your ATP here, get your term back.</h1>
    <p class="v-lede">Photograph your Annual Teaching Plan and, if you have one, the school's teaching planner. Or pick the official Grade 6 Maths Term 4 ATP. Chommie reads weeks, topics and test dates and checks them against CAPS.</p>
    <div class="grid2">
      <div>
        <label class="drop" id="drop"><strong>Choose ATP photos</strong><span class="muted">Up to 3 photos (ATP page, school planner)</span>
          <input type="file" id="atp-file" accept="image/*" multiple class="sr-only" /></label>
        <div class="btn-row">
          <button class="btn btn--ghost" id="btn-official" type="button">Use the official ATP</button>
          <button class="btn btn--ghost" id="btn-sample" type="button">Try the sample ATP photo</button>
        </div>
        <p class="muted" style="font-size:14px">Photos are resized on this device, then read by Claude Sonnet 5.5 through OpenRouter (outside South Africa). The sample is a made-up ATP page.</p>
      </div>
      <div id="atp-out"></div>
    </div>`;
  const out = root.querySelector("#atp-out");
  const show = () => showResult(out, ctx);
  async function readImages(images, label) {
    out.innerHTML = `<p class="loading" role="status">Curriculum Reader is reading ${esc(label)}</p>`;
    try {
      const r = await api("/api/read-atp", { images });
      setAtp({ ...r.atp, source: "photo" }, "Curriculum Reader", "Read " + r.atp.weeks.length + " ATP rows from " + images.length + " photo(s)", r.meta);
    } catch (e) { out.innerHTML = `<p class="notice notice--bad" role="alert">${esc(e.message)}</p>`; }
  }
  function setAtp(atp, agent, detail, meta) {
    state.atp = atp; state.check = checkAgainstCaps(atp, caps); state.atpApproved = false; state.plan = null;
    log(agent, "ATP extracted", detail, meta); save(); show();
  }
  root.querySelector("#atp-file").addEventListener("change", async (e) => {
    const files = [...e.target.files].slice(0, 3);
    if (!files.length) return;
    readImages(await Promise.all(files.map((f) => fileToJpeg(f))), files.length + " photo(s)");
  });
  root.querySelector("#btn-official").onclick = () => setAtp(structuredClone(official), "Curriculum Reader", "Picked the official ATP (no photo)", null);
  root.querySelector("#btn-sample").onclick = async () => {
    const blob = await (await fetch("../demo/atp-gr6-t4.jpg")).blob();
    readImages([await fileToJpeg(blob)], "the sample ATP photo");
  };
  if (state.atp) show();
}

function showResult(out, ctx) {
  const c = state.check, a = state.atp;
  out.innerHTML = `
    <div class="panel-box">
      <h3>${esc(a.subject || "Mathematics")} Grade ${esc(a.grade || 6)}, Term ${esc(a.term || 4)}</h3>
      <p class="muted" style="font-size:14px">Source: ${a.source === "official" ? "official ATP" : "your photo"}. Checked against CAPS.</p>
      <table class="tbl" id="atp-table"><thead><tr><th>Week</th><th>Topic as written</th><th>CAPS check</th></tr></thead><tbody>
      ${c.rows.map((r) => { const s = STATUS[r.status]; return `<tr><td class="mono">${r.from === r.to ? r.from : r.from + "-" + r.to}</td><td>${esc(r.topic)}${r.unclear ? ' <span class="st st--warn">unclear, please check</span>' : ""}</td><td><span class="st st--${s[1]}">${s[0]}</span></td></tr>`; }).join("")}
      </tbody></table>
      ${c.missing.length ? `<p class="notice notice--bad" style="margin-top:14px" role="alert">Required CAPS topics missing from this ATP: ${c.missing.map((m) => esc(m.name)).join(", ")}</p>` : `<p class="notice" style="margin-top:14px">All required CAPS fractions topics are present.</p>`}
      ${a.notes ? `<p class="muted" style="margin-top:10px;font-size:14px">Note: ${esc(a.notes)}</p>` : ""}
      <div class="btn-row">
        ${state.atpApproved ? `<span class="st st--ok">ATP approved by you</span><button class="btn btn--accent" id="go-plan" type="button">Plan my term</button>`
          : `<button class="btn btn--accent" id="approve-atp" type="button">Approve this ATP</button>`}
      </div>
    </div>`;
  const ap = out.querySelector("#approve-atp");
  if (ap) ap.onclick = () => { state.atpApproved = true; log("Teacher", "Approved ATP", "Teacher approved the extracted ATP"); save(); toast("ATP approved"); showResult(out, ctx); };
  const gp = out.querySelector("#go-plan"); if (gp) gp.onclick = () => ctx.go("plan");
}
