import { createClass, esc } from "../state.js";
export async function render(root, ctx) {
  const idx = await (await fetch("../data/atp-index.json")).json();
  const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const subjectsFor = (g) => [...new Set(idx.filter((x) => x.grade === g).map((x) => x.title.replace(/\s*\(Term \d\)\s*$/, "")))].sort();
  root.innerHTML = `
    <h1 class="v-title">Create a class.</h1>
    <p class="v-lede">Three things: the class name, the grade and the subject.</p>
    <form class="panel-box form-narrow" id="class-form" novalidate>
      <div class="field"><label for="c-name">Class name</label><input id="c-name" name="name" required placeholder="6B" autocomplete="off" /></div>
      <div class="field"><label for="c-grade">Grade</label><select id="c-grade" name="grade">${grades.map((g) => `<option value="${g}" ${g === "6" ? "selected" : ""}>Grade ${g}</option>`).join("")}</select></div>
      <div class="field"><label for="c-subject">Subject</label><select id="c-subject" name="subject"></select></div>
      <p class="notice notice--bad" id="class-err" role="alert" hidden>Give the class a name, for example 6B.</p>
      <button class="btn btn--accent btn--big" type="submit" id="class-save">Create class</button>
    </form>`;
  const g = root.querySelector("#c-grade"), s = root.querySelector("#c-subject");
  const fill = () => { const list = subjectsFor(g.value); const prefer = list.find((x) => x === "Mathematics") || list[0]; s.innerHTML = list.map((x) => `<option ${x === prefer ? "selected" : ""}>${esc(x)}</option>`).join(""); };
  g.onchange = fill; fill();
  root.querySelector("#class-form").onsubmit = (e) => {
    e.preventDefault();
    const name = root.querySelector("#c-name").value.trim();
    if (!name) { root.querySelector("#class-err").hidden = false; return; }
    const c = createClass({ name, grade: g.value, subject: s.value });
    location.hash = "#c/" + c.id;
  };
}
