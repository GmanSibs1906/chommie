import { state, onChange } from "./state.js";

const TABS = [
  ["upload", "Upload ATP"], ["plan", "Plan term"], ["teach", "Teach"], ["snap", "Snap books"],
  ["mark", "Mark"], ["check", "Check"], ["heat", "Heat map"], ["homework", "Homework"],
  "sep", ["approvals", "Approvals and log"], ["hod", "HOD overview"], ["settings", "Settings"],
];
const view = document.getElementById("view");
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
}
document.getElementById("btn-demo").onclick = async () => {
  const m = await import("./demo.js"); await m.loadDemoRun(); go("heat");
};
onChange(() => { document.getElementById("demo-banner").hidden = !state.demo; });
const start = (location.hash || "").slice(1);
if (new URLSearchParams(location.search).get("demo")) { import("./demo.js").then((m) => m.loadDemoRun()).then(() => go("heat")); }
else go(TABS.some((t) => t[0] === start) ? start : "upload");
