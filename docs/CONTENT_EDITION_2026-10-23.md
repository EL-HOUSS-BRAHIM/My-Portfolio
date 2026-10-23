# Portfolio content edition — 23 October 2026

The production portfolio rendered its layout but no project cards. A read of the configured portfolio `content` table returned no records. The collection in `web/src/lib/demo-content.ts` now includes 22 reviewed entries: eight projects, four repository milestones, one learning entry, three capability groups, three services, and three journal articles/reports. Every record has English, French, and Arabic text.

The application retains its database publishing model. No fallback bypasses unpublished database content. Local demo mode uses the same collection. `node --import tsx scripts/export-content.ts` exports a validated JSON review payload. Add `--sql` for a transactional, insert-only publication payload. It never connects to a database. The SQL skips any pre-existing record by ID or kind/slug, including drafts, and never overwrites dashboard edits. It does not change schemas, Auth, access policies, submissions, or other applications.

## Pages and visual treatment

- Home: three selected projects and a new journal/report preview.
- Work: eight studies covering the earlier Budgetify web project, shell, log parser, Monty, Watch Party, School News Portal, travel API, and the portfolio.
- About: ordered, RTL-aware repository milestones, learning and capabilities. Milestones are not represented as employment history.
- Journal: three illustrated articles with linked evidence, report scope, findings, and proposed next checks.
- Services: three practical offerings with clear scope-setting language.
- Detail pages: conceptual-cover captions and responsive article images.

Five new SVG covers are original conceptual illustrations, continuing the existing visual system. They are not product screenshots. `watch-party-archive.webp` is a web-optimized development screenshot from `watch-party/.playwright-mcp/videos-page.png`; the English study explicitly identifies its unfinished state and placeholder metadata. Existing portrait and system-project artwork are reused.

## Evidence

Sources reviewed on 23 October 2026:

| Repository | Evidence used |
| --- | --- |
| [simple_shell](https://github.com/EL-HOUSS-BRAHIM/simple_shell) | README: C/Unix project, processes, environment, credits to Brahim El Houss and Ayoub Kial. Created 5 October 2023. |
| [monty](https://github.com/EL-HOUSS-BRAHIM/monty) | Bytecode interpreter and stack description. Created 16 November 2023. |
| [alx-low_level_programming](https://github.com/EL-HOUSS-BRAHIM/alx-low_level_programming) | Learning repository, created 10 August 2023. |
| [School-News-Portal](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal) | README: PHP/MySQL, articles, categories, comments, editorial dashboard. Created 23 December 2024. |
| [alx_travel_app_0x03](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03) | README: listing/booking endpoint contracts and documentation. Created 13 July 2025. |
| [watch-party](https://github.com/EL-HOUSS-BRAHIM/watch-party) | README and tree: Next.js frontend, Django backend, PostgreSQL, Redis/Celery; historical/new deployment notes. Created 19 July 2025. |
| [My-Portfolio](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio) | Existing public project data and October 2026 TypeScript application. |

The 2026 milestone describes the current portfolio revision, not a repository creation date. Budgetify uses only its earlier description already present in the public portfolio; no private repository implementation is published. No testimonials, audience metrics, performance results, employment dates, or certifications were invented. Reports distinguish documented architecture from behavior that still requires testing.

## Validation and rollout

Strict TypeScript, zero-warning lint, 20 unit tests, production build, payload validation, referenced-image existence, unique slugs, translation completeness, and safe SVG checks are required. Browser regression coverage now checks the eight-project filter count and all three locales' milestones, reports, RTL width, article images, and accessibility. Local Chromium installation was unavailable because the downloaded archive was invalid; GitHub CI runs the browser suite.

Publish database entries only after the corresponding image assets are available on the target origin. Production deployment remains an explicit workflow dispatch. A push alone builds and verifies the revision. Keep `main` as the sole branch.
