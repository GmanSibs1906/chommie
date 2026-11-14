export async function render(root, ctx) {
  const items = [["teach", "Lessons", "Write, edit and print a lesson"], ["check", "Check marks", "Decide anything the markers disagreed on"], ["hwwrite", "Write homework", "Make and print each learner's sheet"],
    ["marktable", "Marking table", "All books and their marks"], ["approvals", "Approvals and log", "What you approved and what each agent did"], ["hod", "HOD overview", "Sign-off and export"], ["settings", "Settings", "Thresholds"]];
  root.innerHTML = `<h1 class="v-title">More.</h1><div class="tile-grid">${items.map(([v, a, b]) => `<button class="tile" data-v="${v}" type="button"><span class="tile-title">${a}</span><span class="tile-sub">${b}</span></button>`).join("")}</div>`;
  root.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => ctx.go(b.dataset.v));
}
