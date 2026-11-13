# Chommie

## The goal
Chommie is the teacher's buddy: snap the class's books, and Chommie marks them, checks its own marks, shows who is struggling and rewrites tomorrow's lesson.

## Who it is for
- The owner is the South African teacher working to CAPS and the ATP, especially one with a large class and heavy admin.
- The Head of Department (HOD) sees an overview.
- Learners have no devices and only receive printed homework with their name on it.
- Class sizes in the evidence run from 40+ upwards; the 50–70 and 130+ figures are union-reported SADTU case studies, not DBE statistics. (source: https://www.sadtu.org.za/wp-content/uploads/2025/05/DBE-MEMORANDUM-TO-SADTU-MARCH.pdf)
- The judge, Francois van der Merwe, is CEO of Otinga.io in Johannesburg. His headline is 'Get ROI from AI in Enterprise', so expect a business-value lens. (source: https://www.linkedin.com/in/f-vdm/)

## In scope
- Demo slice: Grade 6 Maths, Term 4, fractions.
- Demo path: book photos, then marks, then the Reviewer catching a wrong mark live, then the heat map, then tomorrow's lesson re-planned, then the voice note "make it shorter".
- 30-day pilot with one school, one grade and one subject.

## Screens
- Upload plan: photograph the ATP and the school teaching planner, or pick the official ATP.
- Term plan: topics placed on real school days, with test and deadline dates marked.
- Lesson view: outline, examples, class work, homework and memo, tagged to its ATP week, with print, edit and voice-note actions.
- Homework review: each learner's personal homework, which the teacher can check and change before printing.
- Snap books: phone camera capture of learners' books.
- Marking review: marks from both markers, with disagreements and unclear handwriting flagged for the teacher.
- Class heat map: each learner against each topic in green, amber or red.
- Assumption: Approvals and activity log: drafts waiting for the teacher's decision, plus the audit trail.
- HOD overview.
- Settings: the struggling threshold (50%) and the class re-teach threshold (40%).

## Features
- Curriculum Reader extracts weeks, topics and test dates from ATP photos and checks them against official CAPS.
- Term Planner puts every topic on a real school day and works back from test and assessment deadlines.
- Lesson Writer produces lessons, class work, per-learner homework and answer memos.
- Personal homework targets exactly what each learner got wrong, with stretch questions for learners who are ahead.
- Homework is printed per learner with the learner's name.
- Marker reads photos of books and marks them against the memo; unclear handwriting is flagged, never guessed.
- Two markers from different AI vendors; any disagreement goes to the teacher.
- Reviewer checks everything independently and sends work back; after two failed fixes it goes to the teacher.
- Analyst builds the heat map and applies the 40% rule; the teacher can change both thresholds.
- Coordinator takes the goal, decides each next step, hands out jobs and re-plans.
- Voice-note editing of lessons, for example "make it shorter".
- Teacher approval gate on drafts, and every step is logged.
- A teacher approval gate and per-mark evidence are expected as standard in AI marking, not differentiators. (source: https://marking.ai/)
- HOD sign-off must come before export; the teacher may print the Excel sheet for HOD signing (source: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- Separate formal (recorded, moderated) from informal (not formally recorded) tasks (source: https://irp-cdn.multiscreensite.com/c0cc1c10/files/uploaded/Senior%20Phase-CAPS%20Amendments--.pdf)
- Mask learner names on-device before upload, auto-delete photos after marking, and keep a per-learner withdraw-consent switch. (source: https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)
- Marker reads all of a learner's pages in one labelled multi-image request, with images placed before the memo. (source: https://docs.anthropic.com/en/docs/build-with-claude/vision)

## Flows, step by step
- Weekly loop: upload the plan, plan the term, teach, send personal homework, snap the books, report, re-plan if needed, and repeat until the term goal is met.
- 40% rule: a learner under 50% on a topic is struggling; under 40% of the class struggling means personal homework only, and 40% or more adds a short class re-teach to an upcoming lesson.
- Re-planning never drops a required ATP topic, finishes before the assessment date and warns early if time is short.
- Marking: two vendors mark, the Reviewer re-checks, and disagreements or unclear handwriting go to the teacher.
- Demo path that must work end to end: upload ATP photo, term plan with test and exam dates, snap books, two markers mark, Reviewer catches a disagreement, teacher decides, heat map, plan adjusted without missing a deadline.

## Content and assets
- Demo data: realistic Grade 6 fractions books with clear handwriting.
- Sourced statistics: 70% name admin as their top stressor (Stellenbosch 2025); 87–92 learners in some Gauteng Grade 1–2 classes (news reports, Feb 2025); 81% of Grade 4 learners cannot read for meaning (PIRLS 2021).
- Buyer wording to reuse: 'Get your evenings back', 'Catch problems early. Fix them fast.', 'this week, not next term'. (source: https://www.teachr.co.za/)
- Headline number: SA teachers mark for 7.1 hours a week vs an OECD average of 4.6 (TALIS 2024) (source: https://thestar.co.za/news/2026-10-29-teachers-early-retirement-puts-working-conditions-under-scrutiny/)
- Data prices are unconfirmed third-party figures with VAT not stated, for example 1GB for R79 on MTN monthly and Vodacom 5GB for R99 plus 5GB night-time valid 30 days (source: https://datacost.co.za/)
- Every example, screen and animation uses Grade 6 Maths, Term 4, fractions, never another grade or term (not Grade 5, not Term 2).
- Never claim Chommie is the only tool that marks handwriting, because CoGrader, Teachr and Marking.ai all do. (source: https://cograder.com/pricing)

## Look and feel
- Look like thwipe.ai: a clean off-white page, a serif headline, one calm colour and lots of space.
- The first thing on the page is the action: 'Drop your ATP here → Plan my term'.
- A light line drawing of a South African classroom, with desks, a chalkboard and a stack of exercise books.
- Step tabs for the loop: Upload ATP, Plan term, Teach, Snap books, Mark, Check, Heat map, Homework.
- Each tab plays a small, gentle animation of the real Chommie screen, such as ticks appearing in a book, the Reviewer catching a wrong mark, or heat-map squares turning from red to green.
- Write headlines the way thwipe.ai does: one plain sentence that says what the product does for you, like 'We collect money that your customers owe you.'
- Follow thwipe.ai's page order: hero, then 'How it works', then what it handles, then what to upload.
- Assumption: Add a 'Who decides what' section like thwipe.ai's About page, showing what Chommie drafts and what the teacher approves.
- Assumption: Add a plain FAQ in thwipe.ai's style, with questions such as 'Is it run by AI or by people?' answered for Chommie.
- Assumption: Copy thwipe.ai's 'Book a 30-minute demo' page and its short footer (Product, Legal), and leave out its pricing page because pricing is out of scope.

## Technical
- SA-SAMS integration means a CSV or file exchange with a local school database that updates quarterly; DBE modernisation is still at pilot stage. (source: https://webfootprint.co.za/integrations/sa-sams-data-extraction-reporting)
- SA-SAMS marks round-trip: Menu 12.3.12.1 export to .xls per grade, class, subject and term → teacher fills it in (-1 = absent with valid reason, no blanks) → Menu 12.3.12.2 import, once only, after HOD approval (source: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- SA-SAMS has no encryption or MFA and data often moves by USB. Any Chommie↔SA-SAMS exchange must not rely on SA-SAMS for security. (source: https://mybroadband.co.za/news/security/580840-data-security-warning-for-parents-of-school-children-in-south-africa.html)
- Cost the Mathpix reading step at $0.005 per page, because exercise-book pages usually have more than 12 rows. That is about $2 a week and $20 a term for a class of 40, and $4.50 a week and $45 a term for a class of 90, plus a one-time $19.99 setup fee, in USD with ZAR and VAT not stated. (source: https://mathpix.com/pricing/api)
- An in-Region Bedrock model ID cannot keep Claude data in Cape Town: in af-south-1, Claude Fable 5.2, Claude Mythos 5.2 and Claude Haiku 5.5 are Global only, and there is no African Geo. (source: https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html)
- Camera: use ImageCapture.takePhoto on Chrome and Samsung Internet; on iOS Safari use video to canvas.toBlob, because ImageCapture is unsupported there (source: https://www.testmuai.com/learning-hub/image-capture-api-browser-support/)
- Offline: keep queued photos in IndexedDB and upload in the foreground; iOS has no Background Sync or Background Fetch (source: https://firt.dev/notes/pwa-ios/)
- Server code runs as Netlify Functions on the chommie-teacher Netlify project.
- The OpenRouter key lives only in the Netlify environment variable OPENROUTER_API_KEY and is never in the page, the repo or the browser.
- Every model ID sits in one config file, and the build is not done until each ID has passed a real test call.
- Camera uses getUserMedia, photos are resized in the browser before upload, and the upload queue sits in IndexedDB so a weak signal loses nothing.
- Update the README at github.com/GmanSibs1906/chommie with how to run locally and how to set OPENROUTER_API_KEY.

## Already decided
These were agreed with the client. Do not reopen them.
- Competitor Teachr charges teachers R100/month (about R1,200 a year for one teacher's single plan, VAT unknown) for 100 marked assignments. That does not cover one class of 40 marked weekly, which is about 160 a month. (source: https://www.teachr.co.za/)
- Pilot runs only for learners whose parent or guardian has signed a specific, informed consent; unconsented books are not photographed. (source: https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)
- Chommie is a web app (Gman's decision). For the pilot it is an installable PWA, Android-first, because Android has 81.78% of South Africa's mobile OS share (source: https://gs.statcounter.com/os-market-share/mobile/south-africa)
- Consent for the demo: demo only, made-up learners and books, no real learner data (Gman's decision).
- The demo is on Saturday 14 November 2026.
- Build the working web app from the approved design (Design library, live at https://chommie-teacher.netlify.app) and host it on that same Netlify project (Gman's decision, 14 Nov 2026).
- All AI calls go through OpenRouter using Chommie's own new key with a $10 spending limit (Gman's decision).
- Models: Curriculum Reader, Term Planner and Lesson Writer use anthropic/claude-sonnet-5.5; Marker A uses anthropic/claude-sonnet-5.5 (vision); Marker B uses google/gemini-3.5-flash (vision, a different vendor); the Reviewer uses openai/gpt-5.5 only when the markers disagree; small jobs use anthropic/claude-haiku-5.5.
- Live with a backup: the camera really photographs books, and the ATP and book photos are really read and marked, with a clearly labelled 'Load demo run' button that loads a prepared Grade 6 Maths Term 4 fractions run with made-up learners.
- Final hand-in is 11:00 on Saturday 14 November 2026.

## Do NOT build
- Pricing and billing, since no pricing is given.
- Assumption: Any learner-facing app or login, since learners have no devices.
- Topics that are not in the uploaded ATP or CAPS.
- Real learner names, books or marks in the demo.

## Known risks
- Teachr already sells photo-of-handwriting marking against a memo, CAPS-aligned Gr 4-12, at R100/month for teachers. 'Marks photos of books' is not unique on its own. (source: https://www.teachr.co.za/)
- Marking.ai claims CAPS and IEB support and handwritten marking, with teacher review and approval, and reports 700+ institutions; teacher plans are £21, £36 and £65 a month, charged in USD, with no ZAR price and VAT not stated. (source: https://marking.ai/pricing)
- SA students and parents already distrust unexplained AI judgements: UCT dropped AI-detector scores over false positives. (source: https://mybroadband.co.za/news/energy/629837-new-tech-rewriting-the-rules-for-universities-in-south-africa.html)
- Per-learner printing costs fall on schools or teachers who already buy supplies themselves (source: https://www.sadtu.org.za/wp-content/uploads/2025/05/DBE-MEMORANDUM-TO-SADTU-MARCH.pdf)
- Learners' names, marks and exercise books are children's personal information. Processing is barred unless a section 35(1) exception applies, chiefly the prior consent of a competent person (POPIA s34–35). (source: https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)
- Regulator enforcement in schools is real: the DBE was fined R5 million over publishing matric results. (source: https://mybroadband.co.za/news/security/580840-data-security-warning-for-parents-of-school-children-in-south-africa.html)
- Gemini in africa-south1 is not confirmed. Google's locations page lists only custom-model features for Johannesburg. (source: https://docs.cloud.google.com/vertex-ai/docs/general/locations)
- Anthropic offers a DPA in which it acts as processor, but the captured text says nothing about children's data or POPIA. (source: https://www.anthropic.com/legal/data-processing-addendum)
- Mathpix keeps images 30 days by default for quality assurance. Turn on Data Retention Opt-Out (deleted within 24 hours) before using it on learner work. (source: https://mathpix.com/pricing/api)
- Commentators say AI struggles with messy handwriting and visual working out, which supports Chommie's flag-don't-guess rule (UK source). (source: https://www.theaccessgroup.com/en-gb/education/software/ai-in-education/ai-marking-for-teachers/)
- Installed iOS web apps ask for camera permission again, and route changes can reset it; keep the camera on one route (source: https://github.com/tsueri/PDF-QR-Scanner/issues/22)
- Commercial Chommie is excluded from ICASA zero-rating ('services for commercial gain are excluded'); only registered PBOs and .gov.za qualify (source: https://gadget.co.za/networksdatafree14w/)
- No real-device data exists for continuous camera use, speed or battery on mobile; the pilot must test on actual low-end Androids (source: https://github.com/tsueri/PDF-QR-Scanner/issues/22)
- Otinga's platform puts winning ideas on 'a track toward real execution', but whether this competition has a pilot or follow-on, and who would own the IP, is unknown. (source: https://innovation-village.com/otinga-io-launches-ai-powered-innovation-platform-for-large-enterprises/)
- Hand-in is 11:00 on 14 November 2026, so only the end-to-end demo path has to work, with the demo run as the fallback.
- The thwipe.ai capture has page headings only, with no colours or fonts, so Chommie's calm colour and serif can't be copied from it and still have to be chosen.
- Marking.ai's free tier is 20 submissions once only, schools get a custom quote with unlimited seats, and school data is stored in the EU. (source: https://marking.ai/pricing)
- CoGrader grades handwritten work, including on its free plan of 150 submissions a month; Individual is $15 a month billed yearly or $19 billed monthly for 350 submissions, schools get a quote, and no CAPS or ATP support is shown. (source: https://cograder.com/pricing)
- The pilot must either accept a transfer abroad under POPIA s72 or use a model that runs in-Region in af-south-1. (source: https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html)
- Assumption: The $10 OpenRouter cap could run out during testing or on stage if vision calls are repeated, and the 'Load demo run' backup covers that.
- Assumption: OpenRouter sends photos to Anthropic, Google and OpenAI abroad, which is fine for made-up demo learners but leaves the pilot's POPIA s72 question open.

## What the competition already does
Researched from their own sites. Build to beat this, not to match it.
**Teachr** — https://www.teachr.co.za/ (from research)
  - Offers: Web subscription for SA parents, teachers and tutors: upload a photo of work plus the memo or rubric and get AI marking, gap analysis and targeted lessons. Teacher plan adds a CAPS lesson-plan generator and class insights.
  - Pricing: Teachers R100/month (100 AI-marked assignments/month). Parents R199/month. ZAR, VAT not stated, no free plan or school plan shown. Taken from the pricing section of teachr.co.za; no separate pricing page was read.
  - Better than us: Live today, priced in rand, also sells to parents, says it reads 'even messy handwriting', and generates CAPS lesson plans.
  - Gap we can take: No mention of the ATP, a term calendar, re-planning tomorrow's lesson, printed per-learner homework, an HOD view, SA-SAMS, flagging unreadable answers, or maths working. The 100-assignments-a-month cap looks small for a large class.
**Marking.ai** — https://marking.ai/ (from research)
  - Offers: AI marking platform for schools and trusts: marks typed and handwritten scripts against an uploaded mark scheme, drafts feedback, teacher approves before release, analytics on where marks were lost. Says it supports CAPS and IEB.
  - Pricing: Not found: only the home page was read ('Start free', 'Book a demo', sample 'School plan · unlimited seats').
  - Better than us: Already claims CAPS/IEB and handwriting. Quotes the evidence for each mark, asks for teacher review on borderline marks, has an approval gate, a security/procurement page and published usage figures (700+ institutions).
  - Gap we can take: Built around scripts and exam papers, with no sign of exercise-book photos, ATP planning, re-planning lessons, per-learner printed homework or SA-SAMS. Not stated whether it flags illegible handwriting.
**Olex.ai** — https://olex.ai (from research)
  - Offers: (UK) AI marking and feedback for schools and trusts, KS1-KS5, 5 subjects.
  - Pricing: Not found.
  - Better than us: Reach (130+ trusts claimed); bulk marking of mock exams; grade progression data.
  - Gap we can take: UK curriculum only on the evidence seen; no CAPS or SA presence shown.
**MarkEase (Dime)** — https://markease.dime.rw (from research)
  - Offers: AI marking 'Built for African Schools' that 'Reads Real Handwriting'.
  - Pricing: Not found.
  - Better than us: Pitches handwriting reading for African schools directly.
  - Gap we can take: No CAPS, ATP or SA-specific claim seen; only headlines were captured.
**CoGrader** — https://cograder.com (from research)
  - Offers: AI essay grading with a rubric library and assignment import; AP Lang rubrics shown.
  - Pricing: Not found (own pricing page not read).
  - Better than us: Rubric library and import workflow.
  - Gap we can take: Essay and AP focus seen; no handwriting photos, maths or CAPS seen.
**Teacha!** — https://teacha.co.za/south-african-teachers-google-acer-are-hosting-free-edtech-events-just-for-you/ (from research)
  - Offers: Marketplace for teacher-made CAPS resources, including term tests with memoranda. Not an AI tool.
  - Pricing: Per resource in ZAR, e.g. R38.00 for a Gr 8 Maths Term 4 paper and memo; VAT not stated.
  - Better than us: Large existing SA teacher audience and English/Afrikaans content.
  - Gap we can take: Sells static papers and memos; nothing to mark them. A possible memo source or partner rather than a rival.
**Fixter (Basingstoke College of Technology)** (from research: https://www.linkedin.com/search/results/content/?keywords=AI+marking+tools)
  - Offers: (UK further education) An AI 'assessment sparring partner' built by teachers, in testing since January. Not shown as a commercial product.
  - Pricing: Not stated.
  - Better than us: Asks the teacher for context before finishing feedback.
  - Gap we can take: Not for sale in SA; FE vocational evidence, not school books.
**The Marking App** — https://themarkingapp.co.za (from research)
  - Offers: From the home-page photo only: 'Quick Scan' and 'Deep Scan' marking of paper and handwritten assessments
  - Pricing: Not seen
  - Better than us: Announced a partnership with the University of Eswatini Growth Lab
  - Gap we can take: Unknown. The product and pricing pages were not read.
**SA Teachers** — https://sateachers.co.za/blog/why-teachers-need-better-assessment-automation (from research)
  - Offers: AI generator and grader tools (described on its own blog)
  - Pricing: Not seen
  - Better than us: Covers essays and rubrics for languages
  - Gap we can take: The blog describes generation and grading only. It mentions no handwritten book capture, ATP re-planning or SA-SAMS export.
**EduFlare** — https://marking.eduflare.co.za (from research)
  - Offers: AI paper-marking software (.co.za domain).
  - Pricing: 'Get Started Free'; no paid tiers captured.
  - Better than us: Free entry point.
  - Gap we can take: Not knowable from the home-page capture alone.
**Intrazero AI Questions** (from research: https://www.linkedin.com/search/results/content/?keywords=AI+handwriting+marking+APIs)
  - Offers: A REST API for question generation, with handwriting auto-grading of scanned answer sheets, rubric essay marking and bubble-sheet OMR added. Sold to universities via a Moodle plugin. Described from a LinkedIn announcement only; the product page was not read.
  - Pricing: Not found; grading features are 'gated per package'.
  - Better than us: Already in production with universities. Returns structured error types, Bloom's level and a handwriting legibility analysis.
  - Gap we can take: Aimed at higher education and Arabic/English exams. Nothing about primary-school maths, CAPS/ATP, printed per-learner homework or re-planning.
**evalAI (student project)** (from research: https://www.linkedin.com/search/results/content/?keywords=AI+handwriting+marking+APIs)
  - Offers: An open GitHub project that evaluates PDF answer sheets with Tesseract and Groq LLaMA vision, then marks per question and produces PDF/CSV reports.
  - Pricing: Free / open source (GitHub link in post).
  - Better than us: Handles flexible question numbering and 'attempt any N of M' rules.
  - Gap we can take: No unreadable-answer flagging, no second marker, no school context.
**Otinga.io (the judge's company, not a competitor)** (from research: https://innovation-village.com/otinga-io-launches-ai-powered-innovation-platform-for-large-enterprises/)
  - Offers: Per a secondary news source: an AI-driven hackathon and innovation platform plus programmes for large enterprises. It is not an education product.
  - Pricing: Not found.
  - Better than us: Not applicable. It does not overlap with Chommie.
  - Gap we can take: None. Its implementation pathway for winning ideas may matter for any follow-on after the competition, but nothing found ties that pathway to this competition.

## Where the data can come from
- SA-SAMS (school-held local database) (https://webfootprint.co.za/integrations/sa-sams-data-extraction-reporting) — Learner, educator and school fields (including LURITS numbers); the target for importing class lists and exporting marks [cost: Not stated; third-party extraction is sold as a custom build (2-6 weeks), price ]
- Teacha! resource marketplace (https://teacha.co.za/south-african-teachers-google-acer-are-hosting-free-edtech-events-just-for-you/) — CAPS term tests and memoranda, worksheets, planners (English and Afrikaans) [cost: Per item in ZAR (e.g. R17.25-R230.00), some free]
- DBE Annual Teaching Plans — Intermediate Phase (https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPsIP.aspx) — Downloadable ATPs per grade and subject, including Mathematics (2026) for Grades 4 and 5, and multigrade ATPs [cost: Free download (no price shown)]
- DBE Annual Teaching Plans — Senior Phase (https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPsSP.aspx) — ATPs for Grades 7–9, including Mathematics (2026) for Grades 8 and 9 [cost: Free download (no price shown)]
- SA-SAMS Excel mark-sheet export/import (EMIS guideline) (https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf) — The file format and rules for getting marks into SA-SAMS (.xls, -1 for absent, single import) [cost: Not stated]
- Information Regulator — Guidance Note on Processing Personal Information of Chil (https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf) — Definitions, the section 34/35 rules, section 35(2) authorisation process and conditions, section 19 security expectations [cost: free]
- DBE Privacy Policy (https://www.education.gov.za/LinkClick.aspx?fileticket=tPbu2GcoZzg%3D&tabid=390&portalid=0&mid=1125) — DBE's own reading of POPIA, the section 38 exemptions, disclosure and retention stance; refers to separate DBE POPIA Guidelines (not fetched) [cost: free]
- Mathpix OCR API (https://mathpix.com/pricing/api) — Handwritten maths and text from images, output as LaTeX, Markdown or MathML. [cost: $0.002 per image (0–1M); $0.005 per page on v3/pdf; $0.0015 per page on Files AP]
- Azure AI Document Intelligence (Read/Layout + formulas add-on) (https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/model-overview?view=doc-intel-4.0.0&amp;form=MG0AV3) — OCR, layout, formula extraction and high-resolution extraction add-ons. [cost: Unconfirmed (source: activepieces.com): Read $1.50 per 1,000 pages; layout $10 p]
- Amazon Bedrock (Claude and others) (https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html) — Hosted foundation models with In-Region, Geo or Global routing. [cost: Not found in pages read.]
- Anthropic Claude API (vision) (https://docs.anthropic.com/en/docs/build-with-claude/vision) — Image understanding through the Messages API and Files API. [cost: Not found in pages read.]
- Google Vertex / Agent Platform africa-south1 (https://docs.cloud.google.com/vertex-ai/docs/general/locations) — Custom-model inference and training in Johannesburg. Gemini there is not confirmed. [cost: Not found in pages read.]
- StatCounter Global Stats – Mobile OS, South Africa (https://gs.statcounter.com/os-market-share/mobile/south-africa) — Monthly Android/iOS share; CSV download; device vendor share also available (not read) [cost: Free to view]
- firt.dev iOS PWA Compatibility (https://firt.dev/notes/pwa-ios/) — Which PWA features iOS Safari supports, by version [cost: Free]
- ICASA zero-rating application process (via Gadget report) (https://gadget.co.za/networksdatafree14w/) — Who qualifies for zero-rating, rules, fair-use caps, deadline [cost: Free to apply (no fee stated)]
- DataCost.co.za (https://datacost.co.za/) — Third-party, source-checked South African bundle prices [cost: Free]

## What the research established
Each line says where it came from. Anything marked an assumption was not verified — treat it as a question, not a fact.
- Teachr is for 'SA parents, teachers & tutors' and says it is 'CAPS-aligned Grades 4-12'. (from research: https://www.teachr.co.za/)
- Teachr's steps: 'Snap a photo of the completed work and the teacher's memo or rubric. Handwritten or typed — even messy handwriting works.' It promises 'detailed marking in under a minute'. (from research: https://www.teachr.co.za/)
- Teachr For Teachers plan: R100/month. Includes 'AI marking — 100 assignments/month marked against your rubric', a CAPS-aligned lesson plan generator, CAPS rubric templates, auto-generated comments for students and parents, and 'Class insights — see which concepts the whole class struggles with'. (from research: https://www.teachr.co.za/)
- Teachr's page does not mention the ATP, SA-SAMS, a free plan, a school or HOD plan, maths working, or what it does when it cannot read handwriting. (from research: https://www.teachr.co.za/)
- Assumption (my sum from Teachr's R100/month, VAT status unknown, taking a term as 3 months): one teacher pays about R300 a term and R1,200 a year (12 months). 20 teachers pay R2,000 a month and R24,000 a year. No school or volume price was shown. (assumption — unverified; the page at https://www.teachr.co.za/ did not clearly say it)
- Marking.ai says it 'marks typed and handwritten work to your marking guidelines and mark scheme, drafts feedback, and keeps teachers in control', and lists '🇿🇦 Built for the South African curriculum - CAPS and IEB' next to GCSE and A-Level. (from research: https://marking.ai/)
- Marking.ai's sample screens show borderline marks handed back to the teacher ('This one is your call…', 'Review suggested'). Each mark quotes 'the words that earned each mark', and 'nothing reaches a student until a teacher approves it'. (assumption — unverified; the page at https://marking.ai/ did not clearly say it)
- Marking.ai shows class analytics: 'Where marks were lost', question by question (e.g. 'Links effect to wider purpose 38%'). (from research: https://marking.ai/)
- Marking.ai's own usage figures, 'Measured 21 August 2026': 700+ institutions, 1,500+ teachers, 51,000+ pieces of work marked. (from research: https://marking.ai/)
- Marking.ai's home page offers 'Start free' and 'Book a demo', and the sample screen shows 'School plan · unlimited seats'. No prices are on the page that was read. (from research: https://marking.ai/)
- Jamie Rood of Marking.ai (LinkedIn) says a school with 6,000 students marks over 100,000 scripts a year, which he puts at 'around 7 and a half years of human work'. (from research: https://www.linkedin.com/search/results/content/?keywords=AI+marking+tools)
- (UK source) Fixter, an AI marking tool being tested at Basingstoke College of Technology since January, 'stops and asks the teacher for something only a human in the room would know' before it finishes any piece of feedback. (from research: https://www.linkedin.com/search/results/content/?keywords=AI+marking+tools)
- (UK source) Olex.ai offers 'AI marking and feedback for schools and trusts'. It claims '130+ Trusts', '5 Subjects', 'KS1-KS5' and 'Bulk mark 30 submissions in minutes' (headlines from a site capture only). (from research: https://olex.ai)
- MarkEase (from Dime, at markease.dime.rw) says it offers 'AI Marking Built for African Schools' and 'Reads Real Handwriting' (headlines from a site capture only). (from research: https://markease.dime.rw)
- CoGrader's site headlines include 'Less time grading, more time teaching', 'Import an assignment', 'Rubric library' and AP Lang argument-essay rubrics. The capture shows essay grading, not photos of handwriting. (from research: https://cograder.com)
- (Canadian market) An eMathSmart Facebook ad offers 'Step-by-step AI help, instant auto-marking, and progress reports' for maths, 'built for the Canadian curriculum', aimed at parents of Grade 3 and 4 children. (from research: https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=AI+marking+tools&search_type=keyword_unordered)
- Teacha! is a South African marketplace (Snapplify) selling teacher-made CAPS resources priced in ZAR, including tests with memos, e.g. 'Graad 8 Wiskunde – Kwartaal 4 – Vraestel 1 en Memorandum R38.00'. It is not an AI marking tool. The page also offers AUD, GBP, KES and USD. (assumption — unverified; the page at https://teacha.co.za/south-african-teachers-google-acer-are-hosting-free-edtech-events-just-for-you/ did not clearly say it)
- A web developer's integration page says 'Most public schools still run SA-SAMS as a local application with a school-held database', that SA-SAMS 'still updates on a quarterly release cycle', and that the DBE is 'mid-modernisation (pilot onboarding reported in March 2026)'. (assumption — unverified; the page at https://webfootprint.co.za/integrations/sa-sams-data-extraction-reporting did not clearly say it)
- The same page says 'Third-party school platforms wait on manual CSVs that arrive late or incomplete'. It also says over 40% of principals surveyed give up '9+ hrs/week' to after-hours admin, and '~60%' considered leaving over compliance load (attributed to 'GBF 2026'). (from research: https://webfootprint.co.za/integrations/sa-sams-data-extraction-reporting)
- UCT dropped Turnitin's AI-detector score because of 'a lot of false positives… but also false negatives', according to Sukaina Walji of UCT. (from research: https://mybroadband.co.za/news/energy/629837-new-tech-rewriting-the-rules-for-universities-in-south-africa.html)
- SA-SAMS marks can be exported to Excel via Menu 12.3.12.1 ('Export Mark-sheet to Excel') after choosing folder, grade, class, subject and term, and imported back via Menu 12.3.12.2. (from research: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- Export/import rights must be enabled: security switched on in Menu 16.13 and users (admins) given export/import rights in Menu 16.11. (from research: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- Task totals and dates must be set before import 'as they cannot be changed once import has been carried', and all tasks for the term must be opened first. (from research: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- The exported mark-sheet must not be renamed 'except adding class name before .xls, e.g A for 7A'. (from research: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)
- Teachers enter marks in the Excel mark-sheet and must 'put (-1) if learner was absent with valid reason. DO NOT LEAVE ANY BLANK SPACES'. (from research: https://leboneti.co.za/My-Documents/guidelines/Capturing%20SASAMS%20marks%20on%20excel.pdf)

## What users complain about today
Read off forums and reviews, in their words. These are the problems the product is being hired to solve.
- "Hellopeter's AI summary of Think Digital Academy reviews lists 'concerns around exam marking accuracy and report quality'; one review is titled 'Upsetting use of ai that doesn't work'." — hellopeter.com (from research: https://www.hellopeter.com/think-digital-academy)
- "A STADIO student who got below 20% says the lecturer called the work 'completely AI-generated' without a 'detailed explanation… or a fair opportunity to explain my work'." — hellopeter.com (from research: https://www.hellopeter.com/stadio)
- "UCT's Sukaina Walji: AI detectors give 'a lot of false positives… These are just not reliable tools for us to feel comfortable to continue using them.'" — mybroadband.co.za (from research: https://mybroadband.co.za/news/energy/629837-new-tech-rewriting-the-rules-for-universities-in-south-africa.html)
- "A forum user finds it 'a bit insulting' when people paste whole AI outputs into messages instead of engaging." — mybroadband.co.za (from research: https://mybroadband.co.za/forum/threads/ai-generated-communications-in-day-to-day-interactions.1333222/)
- ""It felt as if I was just working to complete and submit a form on time. It was no longer about good teaching and making sure learners understood the work." She described 'a 10-week programme that was expected to be completed in six weeks'." — thestar.co.za (from research: https://thestar.co.za/news/2026-10-29-teachers-early-retirement-puts-working-conditions-under-scrutiny/)
- ""I did not care how much I was going to get. I had nothing left to give."" — thestar.co.za (from research: https://thestar.co.za/news/2026-10-29-teachers-early-retirement-puts-working-conditions-under-scrutiny/)
- "A former Northern Cape principal said the biggest relief was no longer dealing with "meetings, emails and circulars"." — thestar.co.za (from research: https://thestar.co.za/news/2026-10-29-teachers-early-retirement-puts-working-conditions-under-scrutiny/)
- "Teachers in the RESEP study described the admin workload as "unnecessary" and "detached from teaching needs"." — timeslive.co.za (from research: https://www.timeslive.co.za/news/south-africa/2025-10-22-teachers-are-burnt-out-sadtu-calls-for-more-mental-health-support-as-matric-exams-begin/)
- "A Grade 5 teacher in Gauteng 'often works late into the night preparing lessons and grading assignments, leaving her exhausted and stressed' (SADTU case study, paraphrased by the union)." — sadtu.org.za (from research: https://www.sadtu.org.za/wp-content/uploads/2025/05/DBE-MEMORANDUM-TO-SADTU-MARCH.pdf)
- ""They honestly are grossly underpaid. Especially with all the stupid hours they put in." Another member replied: "They are grossly overpaid considering the results they produce." (Public members, not confirmed teachers.)" — mybroadband.co.za (from research: https://mybroadband.co.za/forum/threads/how-much-teachers-should-really-earn-in-south-africa.1312354/)
- "A parent says Curro Aurora 'sent the private academic and personal reports of 21 other students to myself and a third parties', calling it 'a severe violation of' POPIA." — hellopeter.com (from research: https://www.hellopeter.com/curro/reviews/curro-aurora-defying-court-orders-enrollment-contracts-and-child-safety-protocols-6344447)
- "A school administrator on SA-SAMS patches: 'We always hope and pray they don't make any changes.'" — mybroadband.co.za (from research: https://mybroadband.co.za/news/security/580840-data-security-warning-for-parents-of-school-children-in-south-africa.html)

## What people are asking for and cannot buy
- Ntsiki Nogwam asks: 'AI comes with the responsibility to protect learner and educator data under POPIA. Are our leaders having compliant systems?' (from research: https://x.com/search?q=POPIA+learner+data&f=live)
- Only transcribe a word at 80% or higher confidence; otherwise mark it illegible or uncertain. (r/Ancestry) (from research: https://www.reddit.com/search/?q=AI+handwriting+marking+APIs)
- 'Do you need third-party hardware support like camera, Wi-Fi, NFC, etc? No? Web app is probably better... if it does something resource intensive, a native app might be better.' (from research: https://mybroadband.co.za/forum/threads/administration-app-desktop-app-or-web-app.971525/)
- 'No matter what we think about AI, it's going to be there, so they need to be able to use it properly' (teacher quoted in the Oxford report) (from research: https://mybroadband.co.za/news/ai/673897-school-students-using-chatgpt-gemini-and-meta-ai-to-survive-matric-exams-in-south-africa.html)
- Other platforms that use SA-SAMS data wait on hand-made CSVs, and DBE/district templates ask for fields already in SA-SAMS. Schools want marks captured once. (from research: https://webfootprint.co.za/integrations/sa-sams-data-extraction-reporting)
- Parents want to know about struggles 'this week, not next term' instead of waiting for the report card. (from research: https://www.teachr.co.za/)
- Less admin and paperwork. 70% of teachers name admin duties as their biggest source of stress. (from research: https://www.timeslive.co.za/news/south-africa/2025-10-22-teachers-are-burnt-out-sadtu-calls-for-more-mental-health-support-as-matric-exams-begin/)
- The union asks that non-teaching tasks be delegated and paperwork streamlined. (from research: https://www.sadtu.org.za/wp-content/uploads/2025/05/DBE-MEMORANDUM-TO-SADTU-MARCH.pdf)
- A way to cover a programme in less time than planned without losing understanding ('10-week programme ... in six weeks'). (from research: https://thestar.co.za/news/2026-10-29-teachers-early-retirement-puts-working-conditions-under-scrutiny/)
- Education leaders are asking whether the AI systems used with learner data are POPIA-compliant. The tweet asks the question but points to no answer or product. (from research: https://x.com/search?q=POPIA+learner+data&f=live)

## What the research did not cover
Lines marked "from research" came from pages that were read, each with its address. Anything about competitors, prices, users or the market that is NOT listed was not researched: do not fill it in from memory, and where it matters, say it is unknown.
- Not settled by the research: Gradescope, Snorkl, Brisk Teaching, MagicSchool, Graide, Siyavula and Otinga.io: none of their product or pricing pages were fetched, so handwriting, maths working, CAPS/ATP support and prices are unknown. They need a second run.
- Not settled by the research: What is Marking.ai's price in ZAR, what are its free-plan limits, and is VAT included? Its pricing page was not read.
- Not settled by the research: Do Teachr's R100 and R199 prices include 15% VAT, is there a school or 20-teacher price, and is there a free tier?
- Not settled by the research: Does Teachr or Marking.ai flag illegible handwriting or guess, and do either of them mark step-by-step maths working?
- Not settled by the research: Does any SA tool read the ATP, or export to SA-SAMS? Nothing seen says so.
- Not settled by the research: How long is a term for pricing purposes (the 3-month figure is an assumption)? How many books a month does a typical large class produce against caps like Teachr's 100?
- Not settled by the research: How many written maths exercises must a Grade 4–7 teacher mark each week, and how often are books checked? Not found. Needs the actual 2026 Mathematics ATP PDFs or a provincial book-control circular.
- Not settled by the research: What does an HOD control, and how often (book controls, SBA moderation per term)? Only 'internal moderation by the SMT' was found, with no frequency. The National Protocol for Assessment and the NPPPR themselves were not read.

## What the findings say it must do
Drawn from the meeting, every site looked at and the research. The plan above wins where they disagree.
- Upload plan screen: photograph the ATP and the school teaching planner, or pick the official ATP. Extract weeks, topics and test dates and check them against CAPS. (from research)
- Term Planner: place every topic on a real school day and work back from test and assessment dates. Never drop a required ATP topic, and warn early when time is short.
- Compressed-term re-planner that merges or shortens ATP topics to reach the next formal task date. (from research)
- Lesson Writer: outline, examples, class work, homework and memo, tagged to its ATP week, with print, edit and voice-note actions.
- Plain code, not the model, computes totals, percentages and dates, and memo answers are proven by calculation.
- Homework for each learner, built from what that learner got wrong, with stretch questions for learners who are ahead. The teacher can review and edit it, and it prints with the learner's name. (from research)
- Camera capture: ImageCapture.takePhoto on Chrome and Samsung Internet, and video drawn to canvas.toBlob on iOS Safari. (from research)
- Detect torch and zoom from track.getCapabilities(), not getSupportedConstraints(). (from research)
- Keep the camera on one screen: start it on the teacher's tap, avoid hash or pushState navigation while it is live, and stop tracks on visibilitychange. (from research)
- Offline queue: store each photo in IndexedDB tagged to the learner and resume uploads while the app is open, with a hold-until-Wi-Fi setting and a send-now override. (from research)
- Mask names on the phone: blur or crop the name strip and swap in a class code before upload. Keep the code-to-name map on the teacher's phone and restore names locally for printing. (from research)
- Reading step: Mathpix with Data Retention Opt-Out switched on at setup. (from research)
- Send each learner's pages in one multimodal request, labelled 'Image 1:', 'Image 2:', with the images before the memo, as base64 when calling through Bedrock or Google. (from research)
- Legibility gate: give each transcribed answer a confidence score. Below the threshold it gets no mark and goes into the teacher's review queue as a cropped image. (from research)
- Handle answers spread across pages, answers out of order, crossed-out work, diagrams mixed with text, and partial credit. (from research)
- Two markers from different AI vendors, then a Reviewer. Disagreements go to the teacher, and anything that fails two fixes goes to the teacher.
- Analyst: build the heat map and apply the 40% rule. A learner under 50% on a topic is struggling; at 40% or more of the class struggling, add a short class re-teach. Both thresholds are editable in Settings.
- Approval gate on every class batch before marks, homework or HOD numbers are released, plus an activity log of every step. (from research)
- Log the vendor, region and routing mode of every AI call and show the log on the HOD overview. (from research)
- Tag each task as formal or informal. Only formal tasks go to the record sheet and export; informal work feeds the struggling view. (from research)
- SA-SAMS export: an .xls mark sheet per grade, class, subject and term. Use -1 for absent with a valid reason, allow no blanks, change the file name only by adding the class letter, and fix task totals and dates first. (from research)
- HOD sign-off: a printable mark sheet for the HOD to sign, with export locked until the HOD approves. (from research)
- Moderation evidence pack for each formal task: the memo, the mark list and photos of marked book pages. (from research)
- Consent register: a written consent from a parent or guardian for each learner, plus a switch to withdraw it. Chommie will not photograph the book of a learner without consent. (from research)
- Delete photos automatically once marking is confirmed, and purge everything at the end of the pilot with a deletion report for the school. (from research)
- Upload queue that stays within each vendor's rate limits and retries rejected requests. (from research)
- Voice-note editing of lessons, for example 'make it shorter', using MediaRecorder. (from research)
- Demo mode that runs the whole loop on made-up Grade 6 fractions learners and book photos with clear handwriting, scripted along the demo path. (from research)
- Optional: turn a bought test and memo, for example from Teacha!, into a mark scheme by photo or upload. (from research)

## The market it lands in
- The buyer and owner is the SA teacher working to CAPS and the ATP with a large class. The HOD is a second user who sees an overview.
- Describe the 50 to 70 and 130+ class sizes as union-reported SADTU case studies, not DBE statistics. (from research)
- Use TALIS 2024 as the headline number: SA teachers mark 7.1 hours a week against an OECD average of 4.6. This replaces the plan's note that there was no SA marking-hours figure. (from research)
- Supporting pain: 70% name admin as their biggest stress (Stellenbosch RESEP), and 44% of teachers very often or always feel burned out (SADTU). (from research)
- Teachr, the closest SA rival: R100 a month for teachers with 100 marked assignments, and R199 a month for parents. VAT is not stated, and there is no school or free plan. (from research)
- Teachr's 100 assignments a month does not cover one class of 40 marked weekly, which is about 160 a month. (from research)
- EduFlare (SA): Starter R349 for 50 credits, Pro R1,199 for 200, Max R4,999 for 1,000, with VAT included. One credit is one paper, and it claims R5 to R7 a paper. It hosts in South Africa and claims CAPS and IEB.
- Marking.ai: teacher plans at £21, £36 and £65 a month, charged in USD, with no ZAR price and VAT not stated. The free tier is 20 submissions once. Schools get a quote, data is stored in the EU, and it claims CAPS and IEB. (from research)
- CoGrader: a free plan of 150 submissions a month and Individual at $15 a month billed yearly or $19 monthly for 350. It marks handwriting and shows no CAPS or ATP support. (from research)
- The Marking App (SA) sells institutional B2B and B2G licences with no published prices, and has a registered PBO arm. MarkEase (Rwanda) claims CAPS and is demo-only.
- Teacha! is a possible partner or memo source, not a rival. It sells CAPS resources for R17.25 to R230, and some are free. (from research)
- Position on what nobody shows: ATP-aware term planning, re-planning tomorrow's lesson, printed homework for each learner, an HOD overview, SA-SAMS-ready export, and flagging unreadable answers. (from research)
- Treat teacher approval and evidence for each mark as table stakes, not as selling points. (from research)
- Evenings back is a crowded message: Teachr uses 'Get your evenings back', Marking.ai 'Your evening back', and EduFlare 'Evenings were never meant for a red pen'.
- Pitch to the judge's lens: one workflow, one owner, and one number, which is learners moving from red to green with the ATP finished on time. (from research)

## Risks the findings raised
- 'Marks photos of books' is not unique: Teachr, Marking.ai, CoGrader, EduFlare, MarkEase and The Marking App all mark handwriting. (from research)
- POPIA bars processing children's information unless a section 35(1) exception applies, chiefly the prior consent of a competent person. (from research)
- Enforcement in schools is real: the Regulator fined the DBE R5 million over publishing matric results. (from research)
- Claude cannot run in-Region in Cape Town: in af-south-1, Fable 5.2, Mythos 5.2 and Haiku 5.5 are Global only and there is no African Geo. Gemini in Johannesburg is not confirmed either. (from research)
- Anthropic's DPA says nothing about children's data or POPIA in the captured text. (from research)
- Mathpix keeps images for 30 days by default. (from research)
- Reading messy handwriting and visual working is the hard part. One user reports about a 10% error rate on handwriting OCR. (from research)
- People in SA education already distrust unexplained AI judgements: UCT dropped AI-detector scores over false positives. (from research)
- Printing homework for each learner adds paper costs that teachers often pay themselves. (from research)
- Mobile data costs fall on teachers, and a commercial Chommie cannot be zero-rated, because ICASA zero-rating covers only registered PBOs and .gov.za sites. (from research)

## Still unanswered
Nobody has decided these. Do not guess and do not invent an answer that looks decided. Where one blocks you, take the smallest reversible option, and write what you chose and why in the report so a person can confirm it:
- Gradescope, Snorkl, Brisk Teaching, MagicSchool, Graide, Siyavula and Otinga.io: none of their product or pricing pages were fetched, so handwriting, maths working, CAPS/ATP support and prices are unknown. They need a second run.
- Do Teachr's R100 and R199 prices include 15% VAT, is there a school or 20-teacher price, and is there a free tier?
- How many written maths exercises must a Grade 4–7 teacher mark each week, and how often are books checked? Not found. Needs the actual 2026 Mathematics ATP PDFs or a provincial book-control circular.
- What does an HOD control, and how often (book controls, SBA moderation per term)? Only 'internal moderation by the SMT' was found, with no frequency. The National Protocol for Assessment and the NPPPR themselves were not read.
- How are ATP catch-ups and revised ATPs handled when a class falls behind? No DBE recovery-plan or catch-up circular was read.
- Whether the school's section 38 'relevant function' exemption reaches a third-party pilot is unsettled. (source: https://www.education.gov.za/LinkClick.aspx?fileticket=tPbu2GcoZzg%3D&tabid=390&portalid=0&mid=1125)
- Section 72 (transfers abroad) was not read. Is sending learner book images to US AI vendors allowed, and on what terms? Michalsons (opinion) suggests children's data transfers may need prior authorisation, and the Regulator's transborder guidance note was unpublished as of March 2026.
- Sections 20–21 (operator duties and the written contract) were not read. What exactly must the school–Chommie agreement contain, and does it need to flow down to the AI vendors as sub-operators?
- Section 57 (prior authorisation) was not read. Does processing children's information, or transferring it abroad, trigger it for a 30-day pilot? How long does Regulator authorisation take? The Guidance Note gives no timeframe.
- Confirm Document Intelligence availability in South Africa North from Microsoft's regional-availability doc; so far it rests on a Q&A moderator answer. (source: https://learn.microsoft.com/en-us/answers/questions/2156548/availability-and-replication-info-on-azure-documen)
- What are the vendors' own per-token or per-page prices for Anthropic Claude, OpenAI, Google Gemini, AWS Textract and Azure Document Intelligence? None were on the pages read, so the weekly and per-term cost with two markers plus a reviewer cannot be worked out beyond the Mathpix reading step.
- Is AWS Textract offered in af-south-1? No Textract page was read.
- Which low-cost phone models are common among South African teachers? No device or vendor-share data was read (StatCounter has a device vendor page that was not fetched).
- Can a browser control focus (focusMode, pointsOfInterest) on Chrome Android and iOS Safari? The camera sources read cover torch and zoom only.
- MediaRecorder on iOS Safari and Chrome Android: which audio MIME types does each record (for example audio/mp4 or audio/webm)? No MDN or WebKit page was read.
- The competition rules (name, deadline and time zone, entry format, criteria and weights, the 'one workflow' rule, data, IP, team size, stack, prizes, pilot) were not found anywhere public. Get them in writing from Francois van der Merwe or Otinga. (source: https://x.com/search?q=Otinga+AI+competition&f=live)
- What is the competition officially called, and is there an entry page or terms document?
- What time is the demo on Saturday 14 November 2026, and in which time zone?
- Which one calm colour should Chommie use, or should we take it from thwipe.ai once the page is fetched?
- For Saturday, should the Chommie site be one landing page, or should it also have thwipe.ai-style FAQ, About ('Who decides what') and 'Book a demo' pages?
- For the 30-day pilot, should learner book photos go to AI vendors abroad under POPIA s72, or must we use only models that run in-Region in Cape Town (af-south-1)?
- Is 11:00 on Saturday also when the live demo happens, or only the hand-in, and is that South African time?

## Do these, in this order
1. Wire the approved design to Netlify Functions and OpenRouter, test every model ID with a real call, prepare the demo run, run the demo path end to end, then update the README before 11:00.
