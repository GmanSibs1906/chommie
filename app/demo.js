// "Load demo run": a prepared Grade 6 Maths, Term 4, fractions run with made-up learners. It starts after marking, so the
// presenter can walk the path: Reviewer catches a wrong mark, teacher decides, heat map, re-plan, voice note "make it shorter".
import { state, reset, log, toast } from "./state.js";
import { deleteAll } from "./db.js";
import { maskAndStore } from "./views/snap.js";

export async function loadDemoRun() {
  const run = await (await fetch("../demo/demo-run.json")).json();
  await deleteAll(); reset(run);
  for (const code of ["6B-014", "6B-022", "6B-031"]) await maskAndStore(await (await fetch(`../demo/books/${code}.jpg`)).blob(), code, "review");
  log("Coordinator", "Loaded the prepared demo run", "Clearly a demo: made-up learners and books. 3 items wait for the teacher.");
  toast("Demo run loaded. Made-up learners only.");
}
