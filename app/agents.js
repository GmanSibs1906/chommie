// Agent labels: every screen says which agent works there and what it does. Shown above each screen by the router.
export const AGENTS = {
  coordinator: ["Coordinator", "takes your goal, decides the next step and hands each job to the right agent."],
  reader: ["Curriculum Reader", "reads the official ATP (PDF or photos) and turns it into weeks, topics, hours and assessment dates."],
  planner: ["Term Planner", "puts every ATP topic on a real school day and works back from test and exam dates."],
  writer: ["Lesson Writer", "writes each lesson, the class work, every learner's own homework and the memo."],
  markers: ["Marker A (Anthropic) and Marker B (Google)", "two companies each read every book and mark it against the memo. Unclear handwriting is never guessed."],
  reviewer: ["Reviewer (OpenAI)", "checks both markers independently, sends work back, and passes any disagreement to you."],
  analyst: ["Analyst", "builds the heat map from the marks and applies the 40% rule to decide re-teach or personal homework."],
};
// view name -> agent key
export const VIEW_AGENT = {
  login: "coordinator", classes: "coordinator", new: "coordinator", overview: "coordinator", more: "coordinator",
  atp: "reader", plan: "planner", teach: "writer", learners: "reader", markflow: "markers", marktable: "markers",
  snap: "markers", check: "reviewer", heat: "analyst", homework: "writer", hwwrite: "writer", approvals: "coordinator", hod: "coordinator", settings: "analyst", fixes: "reviewer",
};
const JOB = { fixes: "every mistake an agent made that another check caught, and every doubt it refused to guess.", markflow: "two companies each read every book and mark it against the memo. The Reviewer settles any disagreement.", homework: "writes each learner's own homework from what they got wrong, and the markers mark it against that learner's own memo.", learners: "reads a photo of your class list into names. You confirm and edit every name before it is added." };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function agentCard(view) {
  const [name, job0] = AGENTS[VIEW_AGENT[view] || "coordinator"], job = JOB[view] || job0;
  return `<div class="wrap"><aside class="agent-card" data-agent="${esc(view)}" aria-label="Agent on this screen"><p class="agent-name">${esc(name)}</p><p class="agent-job">${esc(job)}</p><p class="agent-live" id="agent-live" role="status" aria-live="polite" hidden></p></aside></div>`;
}
// While an agent works, the card says so, e.g. "Marker B (Google) is marking 6B-014".
export function busy(text) { const el = document.getElementById("agent-live"); if (el) { el.textContent = text; el.hidden = false; el.classList.add("is-working"); } }
export function idle(text = "") { const el = document.getElementById("agent-live"); if (el) { el.textContent = text; el.hidden = !text; el.classList.remove("is-working"); } }
