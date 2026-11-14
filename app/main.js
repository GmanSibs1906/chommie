import { state, onChange, user, activeClass, useClass, classes, logout } from "./state.js";
import { nextStep } from "../shared/coordinator.js";
import { listPhotos } from "./db.js";
import { agentCard } from "./agents.js";

// Hash router: #login, #classes, #new, #c/<id>, #c/<id>/<view>
const FILES = { overview: "overview", more: "more", atp: "atp", plan: "plan", teach: "teach", learners: "learners", markflow: "markflow",
  marktable: "mark", snap: "snap", check: "check", heat: "heat", homework: "hwlearner", hwwrite: "homework", approvals: "approvals", hod: "hod", settings: "settings" };
const ALIAS = { upload: "atp", snap: "markflow", mark: "markflow" };
const view = document.getElementById("view"), slot = document.getElementById("agent-slot");
const backBtn = document.getElementById("btn-back"), outBtn = document.getElementById("btn-logout"), label = document.getElementById("class-label");
let active = null, token = 0;

export function go(name) {
  name = ALIAS[name] || name;
  const cls = activeClass();
  if (["login", "classes", "new"].includes(name) || !cls) location.hash = "#" + (["login", "classes", "new"].includes(name) ? name : "classes");
  else location.hash = name === "overview" ? "#c/" + cls.id : `#c/${cls.id}/${name}`;
}
const coord = document.createElement("div"); coord.className = "coord"; coord.id = "coord"; coord.hidden = true; document.querySelector(".app-head").after(coord);
async function paintCoord() {
  if (!activeClass() || coord.hidden) return;
  let queued = 0; try { queued = new Set((await listPhotos()).filter((p) => p.status === "queued").map((p) => p.code)).size; } catch {}
  const n = nextStep(state, { queued });
  coord.innerHTML = `<div class="wrap coord-row"><p id="coord-text"><small>Next step ${n.index} of ${n.of}</small>${n.label}. <span style="opacity:.8">${n.reason}</span></p><button class="btn" id="coord-go" type="button">Go</button></div>`;
  coord.querySelector("#coord-go").onclick = () => go(n.view === "homework" ? "hwwrite" : n.view);
}

async function route() {
  const my = ++token;
  if (active && active.leave) { try { active.leave(); } catch {} }
  const parts = (location.hash || "").slice(1).split("/");
  let name = parts[0] || "classes", id = null, sub = null;
  if (!user() && name !== "login") { location.hash = "#login"; return; }
  if (user() && name === "login") { location.hash = "#classes"; return; }
  if (name === "c") { id = parts[1]; sub = parts[2] || "overview"; if (!useClass(id)) { location.hash = "#classes"; return; } name = sub; }
  else if (name !== "login") useClass(null);
  const cls = activeClass();
  const file = id ? FILES[name] : (name === "new" ? "newclass" : name);
  if (!file) { location.hash = "#c/" + id; return; }
  document.getElementById("demo-banner").hidden = !(cls && state.demo);
  label.textContent = cls ? `${cls.name}, Grade ${cls.grade} ${cls.subject}` : (user() ? user().email : "");
  outBtn.hidden = !user() || !!cls; backBtn.hidden = !user() || name === "classes" || name === "login";
  backBtn.onclick = () => { if (!id) go("classes"); else if (name === "overview") go("classes"); else go("overview"); };
  coord.hidden = !(cls && name !== "overview" ? true : false);
  slot.innerHTML = agentCard(name);
  view.innerHTML = '<p class="loading">Loading</p>';
  try {
    active = await import(`./views/${file}.js`);
    if (my !== token) return;
    view.innerHTML = "";
    await active.render(view, { go, cls, name });
  } catch (e) {
    console.error(e);
    view.innerHTML = `<p class="notice notice--bad" role="alert">This screen is not ready yet.</p>`;
  }
  if (my === token) { view.focus({ preventScroll: true }); window.scrollTo(0, 0); paintCoord(); }
}
outBtn.onclick = () => { logout(); location.hash = "#login"; };
onChange(() => { document.getElementById("demo-banner").hidden = !(activeClass() && state.demo); paintCoord(); });
window.addEventListener("hashchange", route);
route();
