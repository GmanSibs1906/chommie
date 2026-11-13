# Requirements — Chommie

Every line below must be BUILT, WORKING and TESTED. The design decides how it LOOKS;
this list decides what it DOES. A page or screen the design did not draw is built in
the design's style — never left out because the design lacks it.

- **R1** [In scope] Demo slice: Grade 6 Maths, Term 4, fractions.
- **R2** [In scope] Demo path: book photos, then marks, then the Reviewer catching a wrong mark live, then the heat map, then tomorrow's lesson re-planned, then the voice note "make it shorter".
- **R3** [In scope] 30-day pilot with one school, one grade and one subject.
- **R4** [Screen] Upload plan: photograph the ATP and the school teaching planner, or pick the official ATP.
- **R5** [Screen] Term plan: topics placed on real school days, with test and deadline dates marked.
- **R6** [Screen] Lesson view: outline, examples, class work, homework and memo, tagged to its ATP week, with print, edit and voice-note actions.
- **R7** [Screen] Homework review: each learner's personal homework, which the teacher can check and change before printing.
- **R8** [Screen] Snap books: phone camera capture of learners' books.
- **R9** [Screen] Marking review: marks from both markers, with disagreements and unclear handwriting flagged for the teacher.
- **R10** [Screen] Class heat map: each learner against each topic in green, amber or red.
- **R11** [Screen] HOD overview.
- **R12** [Screen] Settings: the struggling threshold (50%) and the class re-teach threshold (40%).
- **R13** [Feature] Curriculum Reader extracts weeks, topics and test dates from ATP photos and checks them against official CAPS.
- **R14** [Feature] Term Planner puts every topic on a real school day and works back from test and assessment deadlines.
- **R15** [Feature] Lesson Writer produces lessons, class work, per-learner homework and answer memos.
- **R16** [Feature] Personal homework targets exactly what each learner got wrong, with stretch questions for learners who are ahead.
- **R17** [Feature] Homework is printed per learner with the learner's name.
- **R18** [Feature] Marker reads photos of books and marks them against the memo; unclear handwriting is flagged, never guessed.
- **R19** [Feature] Two markers from different AI vendors; any disagreement goes to the teacher.
- **R20** [Feature] Reviewer checks everything independently and sends work back; after two failed fixes it goes to the teacher.
- **R21** [Feature] Analyst builds the heat map and applies the 40% rule; the teacher can change both thresholds.
- **R22** [Feature] Coordinator takes the goal, decides each next step, hands out jobs and re-plans.
- **R23** [Feature] Voice-note editing of lessons, for example "make it shorter".
- **R24** [Feature] Teacher approval gate on drafts, and every step is logged.
- **R25** [Feature] A teacher approval gate and per-mark evidence are expected as standard in AI marking, not differentiators. (source: https://marking.ai/)
- **R26** [Feature] HOD sign-off must come before export; the teacher may print the Excel sheet for HOD signing (source: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- **R27** [Feature] Separate formal (recorded, moderated) from informal (not formally recorded) tasks (source: https://irp-cdn.multiscreensite.com/c0cc1c10/files/uploaded/Senior%20Phase-CAPS%20Amendments--.pdf)
- **R28** [Feature] Mask learner names on-device before upload, auto-delete photos after marking, and keep a per-learner withdraw-consent switch. (source: https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)
- **R29** [Feature] Marker reads all of a learner's pages in one labelled multi-image request, with images placed before the memo. (source: https://docs.anthropic.com/en/docs/build-with-claude/vision)
- **R30** [Flow] Weekly loop: upload the plan, plan the term, teach, send personal homework, snap the books, report, re-plan if needed, and repeat until the term goal is met.
- **R31** [Flow] 40% rule: a learner under 50% on a topic is struggling; under 40% of the class struggling means personal homework only, and 40% or more adds a short class re-teach to an upcoming lesson.
- **R32** [Flow] Re-planning never drops a required ATP topic, finishes before the assessment date and warns early if time is short.
- **R33** [Flow] Marking: two vendors mark, the Reviewer re-checks, and disagreements or unclear handwriting go to the teacher.
- **R34** [Flow] Demo path that must work end to end: upload ATP photo, term plan with test and exam dates, snap books, two markers mark, Reviewer catches a disagreement, teacher decides, heat map, plan adjusted without missing a deadline.

## Left for later on purpose (do NOT build unless listed above)
- Pricing and billing, since no pricing is given.
- Assumption: Any learner-facing app or login, since learners have no devices.
- Topics that are not in the uploaded ATP or CAPS.
- Real learner names, books or marks in the demo.

Before you say the mission is done, write `.albert/requirements-audit.json`:
`[{"id": "R1", "status": "built", "where": "<files/routes>", "tested": "<how>"},
 {"id": "R7", "status": "blocked", "reason": "<the exact thing that is missing>"}]`
One entry for EVERY id above. "built" means you saw it work in a browser or a test.
