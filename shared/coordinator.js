// Coordinator: takes the goal (cover every required ATP topic before the test, learners moving red to green)
// and decides the next step of the weekly loop from the current state. Plain code; the jobs themselves go to the agents.
import { buildHeat, topicDecisions } from "./analyst.js";
import { fmt } from "./planner.js";

export function loopSteps(S, ctx = {}) {
  const tasks = S.tasks || [], marks = S.marks || {}, task = tasks[0];
  const taskMarks = task ? marks[task.id] || {} : {};
  const nMarked = Object.keys(taskMarks).length;
  const pending = Object.values(taskMarks).reduce((s, m) => s + m.items.filter((i) => i.status !== "agree" && !i.decision).length, 0);
  const queued = ctx.queued || 0;
  const decisions = task && nMarked ? topicDecisions(buildHeat(marks, tasks), S.settings) : [];
  const needReteach = decisions.filter((d) => d.action === "reteach" && !(S.plan?.reteaches || []).some((r) => r.topicId === d.topicId));
  const nextLesson = S.plan?.days.find((d) => d.date > S.today && d.kind === "lesson");
  const formal = tasks.filter((t) => t.type === "formal");
  const hw = Object.values(S.homework || {});
  return [
    { id: "upload", agent: "Curriculum Reader", label: "Upload the ATP", view: "upload", done: !!S.atp, reason: "Chommie needs your ATP to know the weeks, topics and test dates." },
    { id: "approveAtp", agent: "Teacher", label: "Approve the ATP", view: "upload", done: !!S.atpApproved, reason: "Check the topics Chommie read, then approve." },
    { id: "plan", agent: "Term Planner", label: "Plan the term", view: "plan", done: !!S.plan && !!S.planApproved, reason: "Place every topic on a real school day and approve the plan." },
    { id: "teach", agent: "Lesson Writer", label: nextLesson ? `Write and approve the lesson for ${fmt(nextLesson.date)}` : "Teach", view: "teach", done: !nextLesson || !!S.lessons?.[nextLesson.date]?.approved, reason: "The next lesson needs to be written and approved." },
    { id: "snap", agent: "Teacher", label: "Snap the books", view: "snap", done: nMarked > 0 || queued > 0, reason: "Photograph the books of consented learners." },
    { id: "mark", agent: "Markers A and B", label: `Mark ${queued} queued book${queued === 1 ? "" : "s"}`, view: "mark", done: nMarked > 0 && queued === 0, reason: "Two markers from different vendors read every book." },
    { id: "check", agent: "Reviewer and Teacher", label: `Decide ${pending} item${pending === 1 ? "" : "s"} in Check`, view: "check", done: nMarked > 0 && pending === 0, reason: "Disagreements and unclear handwriting wait for you." },
    { id: "confirm", agent: "Teacher", label: "Confirm marks and delete photos", view: "check", done: !!(task && S.marksConfirmed?.[task.id]), reason: "Confirming releases the marks and deletes the photos from this phone." },
    { id: "report", agent: "Analyst", label: "See the heat map", view: "heat", done: !!(task && S.marksConfirmed?.[task.id]) && needReteach.length === 0, reason: needReteach.length ? `${needReteach.map((d) => d.name).join(" and ")}: ${needReteach[0].share}% of the class is struggling, so add a class re-teach.` : "The heat map shows who is struggling." },
    { id: "homework", agent: "Lesson Writer", label: "Approve personal homework", view: "homework", done: hw.length > 0 && hw.every((h) => h.approved), reason: "Each learner's sheet is built from what they got wrong." },
    { id: "hod", agent: "HOD", label: "HOD sign-off on formal marks", view: "hod", done: !formal.length || !!S.hod?.signed, reason: "Export to SA-SAMS stays locked until the HOD signs." },
  ];
}
export function nextStep(S, ctx) { const steps = loopSteps(S, ctx); const s = steps.find((x) => !x.done); return s ? { ...s, index: steps.indexOf(s) + 1, of: steps.length } : { id: "again", label: "Repeat next week", view: "snap", agent: "Coordinator", reason: "The loop is complete. Teach, send homework, snap the books and go again until the term goal is met.", index: steps.length, of: steps.length, done: true }; }

export function termGoal(S) {
  if (!S.plan) return null;
  const lessons = S.plan.days.filter((d) => d.kind === "lesson"), taught = lessons.filter((d) => d.date <= S.today).length;
  return { topicsPlanned: new Set(lessons.map((d) => d.topicId)).size, lessonDays: lessons.length, taught, test: S.plan.term.test, exam: S.plan.term.exam };
}
