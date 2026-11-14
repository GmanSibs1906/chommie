// All teacher data lives on this device (localStorage here, IndexedDB for photos). Nothing is sent except masked pages.
const KEY = "chommie.v1";
const DEFAULTS = () => ({
  settings: { struggle: 50, reteach: 40 }, today: "2026-11-13", planApproved: false,
  atp: null, check: null, atpApproved: false,
  plan: null, lessons: {}, learners: null,
  tasks: null, marks: {}, marksConfirmed: {}, decisions: {}, results: null,
  homework: null, hwSheets: {}, hwRound: 1, markKind: "class", approvals: [], hod: { signed: false },
  log: [], demo: false,
});
export let state = (() => { try { return { ...DEFAULTS(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULTS(); } })();
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); }
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("save failed", e); } listeners.forEach((f) => f()); }
export function reset(next) { state = { ...DEFAULTS(), ...(next || {}) }; save(); }
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
