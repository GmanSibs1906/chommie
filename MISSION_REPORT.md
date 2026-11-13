# Mission report — Chommie

Status log, newest at the bottom. Each feature: what was done, how it was tested, what was observed.

## 1. Foundation — ✅ passing
- Done: approved design copied to repo root and deployed to chommie-teacher.netlify.app; clean `dist/` build (never publishes .albert/planning); `shared/models.json` as the single model config; OpenRouter helper (`netlify/lib/ai.mjs`); `/api/selftest`; landing CTAs wired, "What it handles", "Chommie drafts. You decide.", FAQ, footer (Product, Legal), `/demo.html` (booking form -> `/api/book-demo`, stored in Netlify Blobs), `/privacy.html`.
- Model IDs: `/api/selftest` on the deployed site made a real call (images for vision IDs) to all 4 IDs; all returned OK: claude-sonnet-5.5, gemini-3.5-flash, gpt-5.5, claude-haiku-5.5.
- Key: OPENROUTER_API_KEY is a secret Netlify variable; it is not readable locally, so AI features are tested against the deployed URL.
- Browser test: build_check on the deployed site at 375, 768, 1024: landing text, FAQ open, no horizontal overflow, demo form filled with fake data and submitted ("Thank you" shown), privacy page. 0 failures. Evidence: `.albert/build-checks/foundation/`.
- Fixed along the way: Netlify Forms returned 404, replaced by own function; 8px overflow at 375 clipped.

## 2. Upload plan + Curriculum Reader — ✅ passing (R4, R13)
- Done: `/app/` shell with the step tabs, state store (localStorage), `read-atp` function (Claude Sonnet 5.5 vision via OpenRouter), CAPS check in plain code (`shared/caps.js`: matched / not in CAPS / missing), official-ATP picker, ATP approval gate, activity log entry with vendor and routing.
- Tested: on the deployed site at 375/768/1024: official ATP loads and shows "All required CAPS fractions topics are present"; the generated sample ATP photo is really read by the model (rows "Common fractions", all "In CAPS", no "Not in CAPS"); approve button works. `node --test` for the CAPS logic passes. Evidence: `.albert/build-checks/upload/`.
- Observed: first run at 768 failed on a too-short page-load wait in the test, not the app; fixed the test wait and re-ran green.
- Limit: ATP input is photos only (the model path takes images); PDFs are not read.

## 3. Term plan — ✅ passing (R5, R14, R32 planner side)
- Done: `shared/planner.js` (plain code): 2026 Term 4 school days, ATP weeks placed on real days, test Thu 26 Nov and exam Wed 2 Dec marked, remaining pre-test days become revision, `addReteach` (re-teach block paid from the revision pool, never drops a topic, warns when under 120 min, refuses under 60 min), `verifyPlan` (independent check). Plan screen with calendar, checks, "today" date and plan approval.
- Tested: `node --test` (7 tests pass: school days, all topics before the test, re-teach placement, early warning then refusal, missing topic not invented). Browser on deploy at 375/768/1024: official ATP -> plan shows Thu 26 Nov, Wed 2 Dec, "Every required ATP topic is placed", 180 revision minutes, one test cell, one exam cell, 20+ lesson cells, no overflow, approve works. Evidence: `.albert/build-checks/plan/`.
- Decision to confirm: Term 4 2026 dates (6 Oct to 9 Dec, test 26 Nov, exam 2 Dec) follow the approved design, not a DBE calendar.
