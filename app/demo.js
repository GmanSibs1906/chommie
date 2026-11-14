// "Load demo run": a ready-made demo class (made-up learners and books, Grade 6 Maths Term 4 fractions). This is the ONLY place
// the built-in Grade 6 data is used. It starts after marking so the presenter can walk the path on stage.
import { state, reset, log, toast, createClass, useClass, classes } from "./state.js";
import { deleteAll } from "./db.js";
import { maskAndStore } from "./views/snap.js";

export async function loadDemoRun() {
  const run = await (await fetch("../demo/demo-run.json")).json();
  if (!classes().some((c) => c.id === "demo-6b")) createClass({ id: "demo-6b", name: "6B demo", grade: "6", subject: "Mathematics", demo: true });
  useClass("demo-6b");
  await deleteAll(); reset({ ...run, demo: true });
  for (const code of ["6B-014", "6B-022", "6B-031"]) await maskAndStore(await (await fetch(`../demo/books/${code}.jpg`)).blob(), code, "review");
  log("Coordinator", "Loaded the prepared demo run", "Clearly a demo: made-up learners and books. 3 items wait for the teacher.");
  toast("Demo run loaded. Made-up learners only.");
}
