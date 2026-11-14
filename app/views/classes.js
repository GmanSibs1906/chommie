import { classes, user, useClass, esc } from "../state.js";
export async function render(root, ctx) {
  const list = classes();
  root.innerHTML = `
    <h1 class="v-title">Your classes.</h1>
    <p class="v-lede">${list.length ? "Tap a class to open it. Each class keeps its own plan, learners, marks and homework." : "You have no classes yet. Make your first one."}</p>
    <div class="tile-grid" id="class-list">
      ${list.map((c) => `<button class="tile" type="button" data-id="${esc(c.id)}"><span class="tile-title">${esc(c.name)}</span><span class="tile-sub">Grade ${esc(c.grade)}, ${esc(c.subject)}${c.demo ? ". Made-up demo class" : ""}</span></button>`).join("")}
    </div>
    <div class="btn-row">
      <button class="btn btn--accent btn--big" id="new-class" type="button">Create class</button>
      <button class="btn btn--ghost btn--big" id="btn-demo" type="button">Load demo run</button>
    </div>
    <p class="muted">The demo run is a ready-made class with made-up learners and books, for showing Chommie on stage.</p>`;
  root.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => { useClass(b.dataset.id); location.hash = "#c/" + b.dataset.id; });
  root.querySelector("#new-class").onclick = () => ctx.go("new");
  root.querySelector("#btn-demo").onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = "Loading the demo";
    const m = await import("../demo.js"); await m.loadDemoRun(); ctx.go("check");
  };
}
