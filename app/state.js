// All teacher data lives on this device (localStorage here, IndexedDB for photos). Nothing is sent except masked pages.
// v2: one store holds the login, the classes, and each class's own data. `state` always points at the ACTIVE class's data.
const KEY = "chommie.v2";
const DEFAULTS = () => ({
  settings: { struggle: 50, reteach: 40 }, today: new Date().toISOString().slice(0, 10), planApproved: false,
  atp: null, check: null, atpApproved: false,
  plan: null, lessons: {}, learners: [],
  tasks: null, marks: {}, marksConfirmed: {}, decisions: {}, results: null,
  homework: null, hwSheets: {}, hwRound: 1, markKind: "class", approvals: [], hod: { signed: false },
  log: [], demo: false,
});
let store = (() => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.classes) return s; } catch {} return { user: null, classes: [], active: null, data: {} }; })();
export let state = store.active && store.data[store.active] ? { ...DEFAULTS(), ...store.data[store.active] } : DEFAULTS();
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); }
export function save() {
  if (store.active) store.data[store.active] = state;
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { console.warn("save failed", e); }
  listeners.forEach((f) => f());
}
export function reset(next) { state = { ...DEFAULTS(), ...(next || {}) }; save(); }
// ---- login and classes ----
export const user = () => store.user;
export function login(email) { store.user = { email: String(email).trim() }; save(); } // demo only: the password is never stored
export function logout() { store.user = null; store.active = null; state = DEFAULTS(); save(); }
export const classes = () => store.classes;
export const activeId = () => store.active;
export const activeClass = () => store.classes.find((c) => c.id === store.active) || null;
export function useClass(id) {
  if (store.active && store.active !== id) store.data[store.active] = state;
  if (!store.classes.some((c) => c.id === id)) { store.active = null; state = DEFAULTS(); return null; }
  store.active = id; state = { ...DEFAULTS(), ...(store.data[id] || {}) }; store.data[id] = state;
  return activeClass();
}
export function createClass({ name, grade, subject, demo = false, id }) {
  const cls = { id: id || "c" + Date.now().toString(36), name: name.trim(), grade: String(grade), subject, demo };
  store.classes.push(cls); store.data[cls.id] = DEFAULTS(); save(); return cls;
}
export function deleteClass(id) { store.classes = store.classes.filter((c) => c.id !== id); delete store.data[id]; if (store.active === id) { store.active = null; state = DEFAULTS(); } save(); }
export function log(agent, action, detail = "", meta = null) {
  state.log.push({ at: new Date().toISOString(), agent, action, detail, meta });
  if (state.log.length > 500) state.log.shift();
  save();
}
export async function api(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed (" + r.status + ")");
  return j;
}
export function toast(msg) {
  const t = document.getElementById("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3200);
}
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
