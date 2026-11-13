# Mission report — Chommie

Status log, newest at the bottom. Each feature: what was done, how it was tested, what was observed.

## 1. Foundation — ✅ passing
- Done: approved design copied to repo root and deployed to chommie-teacher.netlify.app; clean `dist/` build (never publishes .albert/planning); `shared/models.json` as the single model config; OpenRouter helper (`netlify/lib/ai.mjs`); `/api/selftest`; landing CTAs wired, "What it handles", "Chommie drafts. You decide.", FAQ, footer (Product, Legal), `/demo.html` (booking form -> `/api/book-demo`, stored in Netlify Blobs), `/privacy.html`.
- Model IDs: `/api/selftest` on the deployed site made a real call (images for vision IDs) to all 4 IDs; all returned OK: claude-sonnet-5.5, gemini-3.5-flash, gpt-5.5, claude-haiku-5.5.
- Key: OPENROUTER_API_KEY is a secret Netlify variable; it is not readable locally, so AI features are tested against the deployed URL.
- Browser test: build_check on the deployed site at 375, 768, 1024: landing text, FAQ open, no horizontal overflow, demo form filled with fake data and submitted ("Thank you" shown), privacy page. 0 failures. Evidence: `.albert/build-checks/foundation/`.
- Fixed along the way: Netlify Forms returned 404, replaced by own function; 8px overflow at 375 clipped.
