# GitHub content snapshot

Reviewed on 2026-10-23 using the authenticated owner's GitHub connection, including public and private repositories. Content is curated, not an automatic repository mirror.

## Added content

Five project case studies (Lyvora, Watch Party, logistics foundations, travel API, and this portfolio), three capability entries, and one editorial article. All have English, French, and Arabic versions. Existing project entries remain intact.

## Evidence

| Entry | Reviewed source | Editorial boundary |
| --- | --- | --- |
| Lyvora | Private Budgetify README and package manifest | Android preview; no production APK or adoption claim; no private source/download links |
| Watch Party | Public watch-party README and backend/requirements/base.txt | Documented architecture and dependencies; no verified usage or performance claim |
| Logistics foundations | Private logistics repository README | Planning/scaffolding; offline sync, tracking, and AI remain goals; repository identity and links omitted from public content |
| Travel API | Public alx_travel_app_0x03 README | Documented listing/booking CRUD and Swagger/ReDoc; no payment or commercial usage claim |
| Portfolio | Current My-Portfolio application and README | Implemented publishing features; no live deployment claim |
| Capabilities | Above sources and existing shell/Monty/log case studies | Technical skills, without invented employers, dates, certifications, or proficiency scores |
| Journal | Original editorial text informed by the Lyvora release documentation | Engineering explanation; no fabricated personal anecdote |

The profile README was also reviewed. Its certification, production application counts, and community-role claims were not carried over because they were not independently substantiated. Empty repositories and prototype variants were excluded.

## Preview and publishing

The entries live in `web/src/lib/github-content.ts` and are included in the existing curated demo collection. Run `npm run dev` and browse `/en/work`, `/fr/work`, `/ar/work`, the About page, and the Journal.

Configured staging/production reads the database instead of this collection. This change does not write hosted data or deploy the website. The existing `web/scripts/seed-content.ts` dry run includes the expanded collection; its apply operation remains restricted to a dedicated staging environment. Production publication uses the existing MFA-protected editorial dashboard after review. Do not bypass the staging restriction or introduce a privileged key into browser code.

This snapshot should be refreshed deliberately as project status changes. No GitHub token, raw private source, infrastructure addresses, or customer records are included in the public content.
