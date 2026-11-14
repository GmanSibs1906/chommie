import { state, save, log, api, toast, esc, activeClass } from "../state.js";
import { checkOfficial, fillWeeks } from "../../shared/atp.js";
import { checkAgainstCaps } from "../../shared/caps.js";
import { fileToJpeg } from "../image.js";
import { busy, idle } from "../agents.js";

let index;
async function loadIndex() { return (index ||= await (await fetch("../data/atp-index.json")).json()); }
const b64 = (buf) => { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };
const clean = (t) => t.replace(/\s*\(Term \d\)\s*$/, "");

export async function render(root, ctx) {
  const idx = await loadIndex(), cls = activeClass();
  const grades = [...new Set(idx.map((x) => x.grade).filter((g) => g !== "multi"))].sort((a, b) => a - b);
  root.innerHTML = `
    <h1 class="v-title">Choose your ATP.</h1>
    <p class="v-lede">Pick the grade, subject and term and Chommie loads the official DBE Annual Teaching Plan. Or upload your own.</p>
    <div class="grid2">
      <div>
        <div class="panel-box"><h3>From the DBE library</h3>
          <div class="field"><label for="a-grade">Grade</label><select id="a-grade">${grades.map((g) => `<option value="${g}" ${g === cls.grade ? "selected" : ""}>Grade ${g}</option>`).join("")}</select></div>
          <div class="field"><label for="a-subject">Subject</label><select id="a-subject"></select></div>
          <div class="field"><label for="a-term">Term</label><select id="a-term">${[1, 2, 3, 4].map((t) => `<option value="${t}" ${t === 4 ? "selected" : ""}>Term ${t}</option>`).join("")}</select></div>
          <button class="btn btn--accent btn--big" id="load-lib" type="button">Load this ATP</button>
        </div>
        <div class="panel-box"><h3>Upload ATP (PDF or photos)</h3>
          <p class="muted">Your own file: a PDF of the whole ATP, or photos of its pages. Chommie reads the term chosen above.</p>
          <label class="btn btn--ghost btn--big drop-btn" for="atp-file">Choose a PDF or photos</label>
          <input type="file" id="atp-file" accept="application/pdf,image/*" multiple class="sr-only" />
        </div>
      </div>
      <div id="atp-out"></div>
    </div>`;
  const $ = (s) => root.querySelector(s), out = $("#atp-out");
  const subj = $("#a-subject"), grade = $("#a-grade");
  const fillSubjects = () => {
    const list = idx.filter((x) => x.grade === grade.value && x.ok);
    const names = [...new Set(list.map((x) => clean(x.title)))].sort();
    const want = names.find((n) => n === cls.subject) || names.find((n) => cls.subject.startsWith(n)) || names[0];
    subj.innerHTML = names.map((n) => `<option ${n === want ? "selected" : ""}>${esc(n)}</option>`).join("");
  };
  grade.onchange = fillSubjects; fillSubjects();
  const show = () => showResult(out, ctx);
  function setAtp(atp, detail, meta) {
    atp = fillWeeks(atp);
    state.atp = atp; state.check = checkOfficial(atp); state.atpApproved = false; state.plan = null; state.planApproved = false;
    log("Curriculum Reader", "ATP read", detail, meta); save(); idle(`Curriculum Reader read ${atp.weeks.length} rows for Term ${atp.term}`); show();
  }
  async function run(label, fn) {
    busy(`Curriculum Reader is reading ${label}`);
    out.innerHTML = `<p class="loading" role="status">Curriculum Reader is reading ${esc(label)}. This takes up to a minute.</p>`;
    try { await fn(); } catch (e) { idle(); out.innerHTML = `<p class="notice notice--bad" role="alert">${esc(e.message)}</p>`; }
  }
  $("#load-lib").onclick = () => {
    const term = Number($("#a-term").value), list = idx.filter((x) => x.grade === grade.value && x.ok && clean(x.title) === subj.value);
    const e = list.find((x) => x.term === term) || list.find((x) => x.term == null);
    if (!e) { out.innerHTML = `<p class="notice notice--bad" role="alert">There is no ATP for that grade, subject and term in the library.</p>`; return; }
    run(`the DBE ATP for Grade ${e.grade} ${clean(e.title)}, Term ${term}`, async () => {
      const r = await api("/api/atp-pdf", { catalogId: e.i, term });
      setAtp({ ...r.atp, source: "dbe" }, `DBE library: Grade ${e.grade} ${clean(e.title)}, Term ${term}${r.meta?.cached ? " (from cache)" : ""}`, r.meta);
    });
  };
  $("#atp-file").addEventListener("change", async (ev) => {
    const files = [...ev.target.files]; if (!files.length) return;
    const term = Number($("#a-term").value), pdf = files.find((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    if (pdf) {
      if (pdf.size > 4 * 1024 * 1024) { out.innerHTML = `<p class="notice notice--bad" role="alert">That PDF is over 4 MB. Upload photos of the pages you need instead.</p>`; return; }
      run(`your file ${pdf.name}`, async () => {
        const r = await api("/api/atp-pdf", { pdf: b64(await pdf.arrayBuffer()), term, grade: cls.grade, subject: cls.subject });
        setAtp({ ...r.atp, source: "upload" }, `Uploaded PDF ${pdf.name}, Term ${term}`, r.meta);
      });
    } else {
      run(`${files.length} photo${files.length > 1 ? "s" : ""}`, async () => {
        const images = await Promise.all(files.slice(0, 8).map((f) => fileToJpeg(f)));
        const r = await api("/api/read-atp", { images, term });
        setAtp({ ...r.atp, source: "upload" }, `Read ${r.atp.weeks.length} ATP rows from ${images.length} photo(s)`, r.meta);
      });
    }
  });
  if (state.atp) show();
}

const SRC = { dbe: "the official DBE ATP", upload: "your own file", official: "the official ATP", photo: "your photo" };
function showResult(out, ctx) {
  const c = state.check, a = state.atp, demo = state.demo;
  const STATUS = { matched: ["Teach", "ok"], extra: ["Not in CAPS", "bad"], assessment: ["Assess", "na"] };
  out.innerHTML = `
    <div class="panel-box" id="atp-box">
      <h3>${esc(a.subject || "")} Grade ${esc(a.grade || "")}, Term ${esc(a.term || "")}</h3>
      <p class="muted" style="font-size:15px">Source: ${esc(SRC[a.source] || "your file")}.</p>
      <div class="tbl-wrap"><table class="tbl" id="atp-table"><thead><tr><th class="nw">Week</th><th>Topic</th><th class="nw">Hours</th><th></th></tr></thead><tbody>
      ${c.rows.map((r) => { const s = STATUS[r.status] || STATUS.matched; return `<tr><td class="mono nw">${r.from === r.to ? r.from : r.from + "-" + r.to}</td><td>${esc(r.topic)}${r.unclear ? ' <span class="st st--warn">unclear, please check</span>' : ""}</td><td class="mono nw">${r.hours ?? ""}</td><td class="nw"><span class="st st--${s[1]}">${s[0]}</span></td></tr>`; }).join("")}
      </tbody></table></div>
      ${c.missing.length ? `<p class="notice notice--bad" style="margin-top:14px" role="alert">Required CAPS topics missing from this ATP: ${c.missing.map((m) => esc(m.name)).join(", ")}</p>` : ""}
      ${(a.assessments || []).length ? `<p class="muted" style="margin-top:12px;font-size:15px">Assessments: ${a.assessments.map((x) => esc(x.name) + (x.week ? " (week " + x.week + ")" : "")).join("; ")}</p>` : ""}
      ${a.notes ? `<p class="muted" style="margin-top:10px;font-size:15px">Note: ${esc(a.notes)}</p>` : ""}
      <div class="btn-row">
        ${state.atpApproved ? `<span class="st st--ok">ATP approved by you</span><button class="btn btn--accent btn--big" id="go-plan" type="button">Plan my term</button>`
          : `<button class="btn btn--accent btn--big" id="approve-atp" type="button">Approve this ATP</button>`}
      </div>
    </div>`;
  const ap = out.querySelector("#approve-atp");
  if (ap) ap.onclick = () => { state.atpApproved = true; log("Teacher", "Approved ATP", "Teacher approved the extracted ATP"); save(); toast("ATP approved"); showResult(out, ctx); };
  const gp = out.querySelector("#go-plan"); if (gp) gp.onclick = () => ctx.go("plan");
}
