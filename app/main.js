import { state, onChange } from "./state.js";
import { nextStep } from "../shared/coordinator.js";
import { listPhotos } from "./db.js";

const TABS = [
  ["upload", "Upload ATP"], ["plan", "Plan term"], ["teach", "Teach"], ["snap", "Snap books"],
  ["mark", "Mark"], ["check", "Check"], ["heat", "Heat map"], ["homework", "Homework"],
  "sep", ["approvals", "Approvals and log"], ["hod", "HOD overview"], ["settings", "Settings"],
];
const view = document.getElementById("view");
// Coordinator bar: always says what Chommie decides the next step is, and hands the job to the right screen.
const coord = document.createElement("div"); coord.className = "coord"; coord.id = "coord"; document.querySelector(".app-head").after(coord);
async function paintCoord() {
  let queued = 0; try { queued = new Set((await listPhotos()).filter((p) => p.status === "queued").map((p) => p.code)).size; } catch {}
  const n = nextStep(state, { queued });
  coord.innerHTML = `<div class="wrap coord-row"><p id="coord-text"><small>Coordinator, step ${n.index} of ${n.of}</small>${n.label}. <span style="opacity:.8">${n.reason}</span></p><button class="btn" id="coord-go" type="button">Go</button></div>`;
  coord.querySelector("#coord-go").onclick = () => go(n.view);
}
const nav = document.getElementById("app-nav");
let current = null, active = null;

nav.innerHTML = TABS.map((t, i) => t === "sep" ? '<i class="sep"></i>' :
  `<button type="button" role="tab" data-v="${t[0]}" aria-selected="false">${i < 8 ? `<span>${String(i + 1).padStart(2, "0")}</span>` : ""}${t[1]}</button>`).join("");
nav.addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (b) go(b.dataset.v); });

export async function go(name) {
  if (active && active.leave) active.leave();       // e.g. stop the camera before changing screen
  current = name;
  nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === name)));
  document.getElementById("demo-banner").hidden = !state.demo;
  view.innerHTML = '<p class="loading">Loading</p>';
  try {
    active = await import(`./views/${name}.js`);
    view.innerHTML = "";
    await active.render(view, { go });
  } catch (e) {
    console.error(e);
    view.innerHTML = `<p class="notice notice--bad" role="alert">This screen is not ready yet.</p>`;
  }
  view.focus({ preventScroll: true });
  paintCoord();
}
document.getElementById("btn-demo").onclick = async () => {
  const m = await import("./demo.js"); await m.loadDemoRun(); go("check");
};
onChange(() => { document.getElementById("demo-banner").hidden = !state.demo; paintCoord(); });
const start = (location.hash || "").slice(1);
if (new URLSearchParams(location.search).get("demo")) { import("./demo.js").then((m) => m.loadDemoRun()).then(() => go("check")); }
else go(TABS.some((t) => t[0] === start) ? start : "upload");
