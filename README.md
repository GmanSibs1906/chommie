# Chommie

The teacher's buddy. Snap the class's books, and Chommie marks them, checks its own marks, shows who is struggling and rewrites tomorrow's lesson.

Demo slice: **Grade 6 Maths, Term 4, fractions**, with made-up learners and books only. Live: https://chommie-teacher.netlify.app (landing page) and https://chommie-teacher.netlify.app/app/ (the app).

## What is in here

| Path | What |
|---|---|
| `index.html`, `screen.css`, `tokens.css`, `fonts/`, `art-*.jpg` | The approved landing page (design in `design/approved/`) |
| `site.css`, `demo.html`, `privacy.html` | Extra landing sections, "Book a 30-minute demo", terms and privacy |
| `app/` | The teacher web app (plain HTML, CSS and ES modules, no build step) |
| `shared/` | Plain-code logic shared by the app and the tests: planner, fractions, marking, analyst, homework, export, coordinator |
| `netlify/functions/` | Server code (Netlify Functions): `read-atp`, `write-lesson`, `write-bank`, `voice-edit`, `mark`, `review`, `selftest`, `book-demo` |
| `shared/models.json` | **Every model ID, in one file** |
| `demo/` | Made-up exercise-book photos, the sample ATP photo and `demo-run.json` |
| `scripts/` | `build.mjs` (publishes only the public folders to `dist/`), `make_demo_images.py`, `make_demo_run.mjs` |
| `tests/` | `node --test` unit tests |

Plain code, not the model, does every total, percentage and date, and every memo answer is proven by calculation.

## Run it locally

Needs Node 22 and the Netlify CLI (`npm i -g netlify-cli`).

```bash
git clone https://github.com/GmanSibs1906/chommie.git && cd chommie
git checkout mission/chommie
npm install            # installs @netlify/blobs (used only by the demo-booking form)
netlify dev            # http://localhost:8888   (app at /app/)
npm test               # unit tests for the planner, fractions, marking, analyst, homework and export
```

Without an API key the pages, planner, heat map, settings, export and the **Load demo run** button all work. The AI steps (reading an ATP photo, writing a lesson, marking books, voice edit) need the key.

## Set OPENROUTER_API_KEY

All AI calls go through [OpenRouter](https://openrouter.ai) using Chommie's own key (with its spending limit). The key lives **only** in the Netlify environment. It is never in the page, the repo or the browser.

1. Create a key at https://openrouter.ai/keys (set a spending limit).
2. Link this folder to the Netlify project once: `netlify link --id 91451a1d-77b2-4f6e-9f91-b0dc5effe2bf` (project `chommie-teacher`).
3. Set it as a secret:
   ```bash
   netlify env:set OPENROUTER_API_KEY "sk-or-..." --secret
   ```
   or in the Netlify UI: Project configuration, Environment variables, add `OPENROUTER_API_KEY`, tick "Contains secret values".
4. Deploy: `netlify deploy --prod --build`.

Secret values are not readable locally, so `netlify dev` cannot call the models. To try the AI steps, deploy and use the live URL. For a local test with your own key, create an untracked `.env` file containing `OPENROUTER_API_KEY=...` (`.env` must stay out of git).

## Prove every model ID

The build is not done until each model ID passes a real call:

```bash
curl https://chommie-teacher.netlify.app/api/selftest
```

It makes one real call (with an image for the vision models) to each distinct ID in `shared/models.json` and returns `"ok": true` when all pass. It costs a fraction of a cent.

| Job | Model |
|---|---|
| Curriculum Reader, Term Planner, Lesson Writer, Marker A (vision) | `anthropic/claude-sonnet-5.5` |
| Marker B (vision, a different vendor) | `google/gemini-3.5-flash` |
| Reviewer (only when the markers disagree) | `openai/gpt-5.5` |
| Small jobs | `anthropic/claude-haiku-5.5` |
| Voice note transcription | `google/gemini-3.5-flash` (audio) |

## The demo path

1. Open `/app/`, tap **Load demo run** (clearly labelled, made-up learners). Or do it live: Upload ATP, Plan term, Snap books (camera, or "Add sample book page"), Mark.
2. **Check**: the Reviewer caught a wrong mark; decide the three items. Confirm marks (photos are deleted).
3. **Heat map**: Related denominators is struggling for 40% or more of the class, so the Coordinator proposes a 15 minute class re-teach.
4. **Re-plan and rewrite that lesson**: tomorrow's lesson (Mon 16 Nov) gains the re-teach, and the Plan screen still meets the test on Thu 26 Nov and the exam on Wed 2 Dec.
5. **Teach**: type or record "make it shorter".

## Privacy

Learner names are covered on the phone before a photo is stored, learners become record numbers, photos live in the phone's IndexedDB and are deleted once the teacher confirms the marks, and each learner has a consent switch. Photos are read by AI vendors outside South Africa through OpenRouter; that is fine for made-up demo learners and is an open POPIA section 72 question for a real pilot.

## Not done, on purpose

Pricing and billing; any learner-facing app or login; topics outside the uploaded ATP or CAPS; real learner data.
