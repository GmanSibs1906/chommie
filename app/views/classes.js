import { classes, useClass, deleteClass, esc } from "../state.js";
import { deleteAll } from "../db.js";

export async function render(root, ctx) {
  const list = classes();
  root.innerHTML = `
    <h1 class="v-title">Your classes.</h1>
    <p class="v-lede">${list.length ? "Tap a class to open it. Each class keeps its own plan, learners, marks and homework." : "You have no classes yet. Make your first one."}</p>
    <ul class="class-list" id="class-list">
      ${list.map((c) => `<li class="class-row"><button class="tile" type="button" data-id="${esc(c.id)}"><span class="tile-title">${esc(c.name)}</span><span class="tile-sub">Grade ${esc(c.grade)}, ${esc(c.subject)}${c.demo ? ". Made-up demo class" : ""}</span></button>
        <button class="btn btn--ghost class-del" type="button" data-del="${esc(c.id)}" aria-label="Delete ${esc(c.name)}">Delete</button></li>`).join("")}
    </ul>
    <div class="btn-row">
      <button class="btn btn--accent btn--big" id="new-class" type="button">Create class</button>
      <button class="btn btn--ghost btn--big" id="btn-demo" type="button">Load demo run</button>
    </div>
    <p class="muted">The demo run is a ready-made class with made-up learners and books, for showing Chommie on stage.</p>`;
  root.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => { useClass(b.dataset.id); location.hash = "#c/" + b.dataset.id; });
  // Delete asks first, in the page (a browser confirm() would freeze screen recordings and kiosks). Second tap deletes.
  root.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "Tap again to delete"; b.classList.add("btn--danger"); setTimeout(() => { if (b.isConnected) { b.dataset.armed = ""; b.textContent = "Delete"; b.classList.remove("btn--danger"); } }, 4000); return; }
    const id = b.dataset.del;
    useClass(id); try { await deleteAll(); } catch {} // this class's photos go too
    deleteClass(id); render(root, ctx);
  });
  root.querySelector("#new-class").onclick = () => ctx.go("new");
  root.querySelector("#btn-demo").onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = "Loading the demo";
    const m = await import("../demo.js"); await m.loadDemoRun(); ctx.go("check");
  };
}
