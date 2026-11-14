Continue the Chommie build in this repo on the existing branch mission/chommie. Read MISSION_REPORT.md and README.md first: features 1-10 are done, tested and deployed at https://chommie-teacher.netlify.app. Do not redo them or redesign anything.

NEW FEATURE (Gman, after testing): mark PERSONAL HOMEWORK.
Today the Mark screen only marks the one class task (getTasks()[0]) against one shared memo, but the Homework tab gives every learner a DIFFERENT sheet with its own answers. A snapped homework sheet must be marked against THAT learner's own sheet and memo.

1. Printed homework sheets carry the learner code (e.g. 6B-014) in large print at the top AND a small QR code with the code and the sheet id (no learner name in the QR).
2. Mark screen: a clear choice "What are you marking?" -> "Class task" (default, unchanged) or "Personal homework".
3. Personal homework: match each snapped page to a learner by (a) the learner picked on Snap books, as today, and (b) the QR / printed code read from the page (read the QR in the browser if possible, otherwise have Marker A read the printed code). If (a) and (b) disagree, or that learner has no approved sheet, do NOT mark it: put it in Check for the teacher.
4. Mark each learner against their OWN sheet questions and proven memo, with the same two markers, Reviewer rules, 'unclear is never guessed' rule and teacher decisions in Check. Store results as their own task per round ('Homework round 1'), informal by default.
5. Homework results feed the heat map per topic and the NEXT homework round.
6. Demo run: add 3 made-up learners' marked homework so the stage path can show it without a camera.
7. Tests: node --test unit tests (right learner, wrong code -> Check, no sheet -> Check, per-learner memo used) and a live end-to-end on the deployed site: homework for at least 3 learners, print, made-up photos of filled-in sheets (one with a wrong answer, one with the wrong code), mark as Personal homework, confirm the right memo was used and the wrong-code page went to Check.
8. Deploy to the SAME Netlify site (chommie-teacher) the same way as before, keep OPENROUTER_API_KEY server-side only, update README.md (how to mark personal homework), add section 11 to MISSION_REPORT.md with honest results and limits. Commit on mission/chommie and push to origin. Do not merge into main.