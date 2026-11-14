import { state, save, log, reset, toast, esc } from "../state.js";
import { deleteAll, listPhotos } from "../db.js";

export async function render(root, ctx) { draw(root, ctx); }
function draw(root, ctx, report) {
  const S = state.settings;
  root.innerHTML = `
    <h1 class="v-title">Settings</h1>
    <p class="v-lede">Two numbers decide when Chommie adds a class re-teach. You can change both.</p>
    <form class="panel-box" id="set-form" novalidate>
      <div class="field"><label for="s-struggle">A learner is struggling on a topic below (%)</label><input id="s-struggle" type="number" min="1" max="99" value="${S.struggle}" inputmode="numeric" /></div>
      <div class="field"><label for="s-reteach">Add a class re-teach when this share of the class is struggling (%)</label><input id="s-reteach" type="number" min="1" max="100" value="${S.reteach}" inputmode="numeric" /></div>
      <p class="muted" style="font-size:14px">Chommie's defaults are 50% and 40%. Below the class line, personal homework fixes it and the lesson plan stays.</p>
      <p id="set-msg" class="notice" role="status" hidden></p>
      <div class="btn-row"><button class="btn btn--accent" type="submit" id="set-save">Save</button><button class="btn btn--ghost" type="button" id="set-default">Back to 50% and 40%</button></div>
    </form>
    <div class="panel-box"><h3>Where you are in the term</h3><p class="muted">Today in this plan: <strong>${esc(state.today)}</strong>. Change it on the Plan term screen.</p></div>
    <div class="panel-box"><h3>End of pilot: delete everything</h3>
      <p class="muted">Removes every photo, mark, lesson and log from this phone and gives you a deletion report to hand to the school.</p>
      <div class="btn-row"><button class="btn btn--danger" id="purge" type="button">Delete everything and make the report</button></div>
      ${report ? `<pre id="purge-report" class="mono" style="white-space:pre-wrap;font-size:13px;background:var(--soft);padding:14px;border-radius:10px">${esc(report)}</pre>` : ""}</div>`;
  const $ = (s) => root.querySelector(s), msg = $("#set-msg");
  $("#set-form").onsubmit = (e) => {
    e.preventDefault();
    const a = Number($("#s-struggle").value), b = Number($("#s-reteach").value);
    if (!(a >= 1 && a <= 99) || !(b >= 1 && b <= 100) || !Number.isInteger(a) || !Number.isInteger(b)) { msg.className = "notice notice--bad"; msg.textContent = "Enter whole numbers: struggling 1 to 99, class re-teach 1 to 100."; msg.hidden = false; return; }
    const before = `${S.struggle}% and ${S.reteach}%`; S.struggle = a; S.reteach = b;
    log("Teacher", "Changed thresholds", `From ${before} to ${a}% and ${b}%`); save();
    msg.className = "notice"; msg.textContent = `Saved: struggling below ${a}%, class re-teach at ${b}%.`; msg.hidden = false;
  };
  $("#set-default").onclick = () => { S.struggle = 50; S.reteach = 40; log("Teacher", "Reset thresholds", "Back to 50% and 40%"); save(); draw(root, ctx); };
  $("#purge").onclick = async () => {
    if (!confirm("Delete everything on this phone? This cannot be undone.")) return;
    const n = (await listPhotos()).length, marks = Object.values(state.marks).reduce((s, t) => s + Object.keys(t).length, 0);
    await deleteAll(); const at = new Date().toISOString(); reset();
    draw(root, ctx, `Chommie deletion report\nDate: ${at}\nPhotos deleted from the phone: ${n}\nMarked books deleted: ${marks}\nLessons, plan, homework and activity log: deleted\nNothing is kept on this phone. Photos were never stored on Chommie's servers.`);
  };
}
