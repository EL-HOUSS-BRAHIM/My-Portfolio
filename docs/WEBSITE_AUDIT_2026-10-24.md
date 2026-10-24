# Website audit and remediation — 2026-10-24

## Scope and evidence

Audit the current Next.js application, live public routes, desktop/tablet/mobile layouts, English/French/Arabic, light/dark themes, keyboard access, forms, metadata, and code consistency. Use the source and live deployment as evidence; do not infer production health from a local build.

Baseline artifacts are under `web/artifacts/audits/baseline-tablet/` (ignored generated evidence). The saved 24-page tablet pass reproduced horizontal overflow on all three homepages and missing canonical metadata on six privacy/feedback pages. An earlier wider pass also reproduced the overflow in both themes. Interactive regression tests additionally exposed stale locale state after client-side language switching. The original automated accessibility suite alone did not catch these issues.

## Findings and fixes

| Priority | Finding | Remediation |
| --- | --- | --- |
| P1 | Locale URL changed while root translations stayed stale; subsequent links could acquire duplicated locale prefixes | Language links now perform ordinary document navigation, preserving the current path/query while refreshing the document language, direction, and translations |
| P1 | Forms without JavaScript could fall back to GET and put entered details in the URL | Explicit POST methods; public controls remain disabled until hydration, with a no-JavaScript explanation; admin forms also use POST |
| P2 | Decorative orbits caused horizontal scrolling around tablet widths | Bound the art container; verify 320, 768, 1024, and 1440px plus enlarged text |
| P2 | Small footer targets and unreachable short-screen menu controls | At least 44px-high footer controls, scrollable mobile dialog, keyboard skip-link focus, and no-JavaScript navigation fallback |
| P2 | Browser-storage exceptions could crash theme controls; cross-tab updates did not repaint the document | Guarded, typed preference store with session fallback and document synchronization |
| P2 | RTL text flow reordered Latin brand punctuation and map coordinates | Isolate the brand and coordinate text as LTR while preserving the Arabic page layout |
| P2 | Project filters reset on reload/language change and lacked result feedback | Store the filter in the URL, retain it through locale navigation, and announce the result count |
| P2 | Lyvora appeared under web applications | Dedicated mobile filter and a narrowly scoped category correction to the existing Lyvora content row |
| P2 | Duplicated form transport logic, indefinite requests, and ambiguous retry feedback | Shared submission hook with a 20-second timeout, synchronous duplicate guard, text preservation, and payload-bound retry identities |
| P2 | A throttled retry could discard the identity of an earlier uncertain send | Keep the identity across rejection/rate-limit responses until success or a payload edit; reproduced on the earlier live release and verified fixed with an intercepted network-failure → 429 → network-failure sequence |
| P2 | Feedback used the enquiry confirmation instead of explaining moderation | Localized feedback-specific labels, submission confirmation, and length guidance |
| P3 | Tenth card was numbered 010; dark card numbers had a fixed low-contrast color | Padded two-digit numbers and theme-aware contrasting badges |
| P3 | Missing privacy/feedback metadata and duplicated home-page brand in the title | Localized metadata/canonicals and an absolute title when the brand is already included |
| P3 | One unillustrated journal card disrupted the grid | Consistent editorial fallback using the existing icon system |
| P3 | Repeated responsive overrides and scattered feedback translations | Consolidated CSS rules and moved feedback strings into the locale dictionaries |
| P3 | Privacy text described theme cookies and a 14-day log period that did not match implementation | Describe browser theme storage, size-rotated logs, archived-enquiry cleanup, and optional notifications accurately; no retention behavior changed |

## Verification commands

From `web/`, run the build, typecheck, zero-warning lint, unit tests, and Playwright suite. Linux CI also runs the disposable database/deployment checks, dependency audits, immutable image builds, and vulnerability scans.

The reusable read-only browser audits are:

- `node scripts/audit-public.mjs`: eight public pages × three locales × three widths × two themes (144 combinations), including axe, overflow, image loading, browser exceptions, headings, and metadata. Set `AUDIT_URL`, `CHROMIUM_PATH`, and optionally `AUDIT_OUTPUT`.
- `node scripts/audit-content.mjs`: every published project/article route discovered from the live sitemap, at 320px in dark mode, including Arabic, images, canonical metadata, direction, and axe.
- `node scripts/audit-interactions.mjs`: language/filter transitions, keyboard navigation, short-screen dialog, and restricted-storage theme behavior. `AUDIT_FORMS=mock` intercepts all form submissions locally to verify retries/confirmation without creating production records or sending notifications.

Generated screenshots and JSON results live outside Playwright's auto-cleared test-results directory. The audit explicitly loads lazy images before assessing them so off-screen images are not incorrectly reported as broken.

## Deployment and repeat-audit status

**Complete for the documented audit scope. All findings above are closed.**

Production revision: `b647b11a06b2235d793103fa6c02e2dfa5d4db1d`. [Deployment workflow 40048937991](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio/actions/runs/40048937991) completed successfully: verification, image publication/scans, and production rollout. CI passed 21 tests across seven unit/deployment test files, 19 browser tests, disposable database checks, production build, zero-warning lint, and dependency audits. All changed application/audit files passed Prettier.

Repeat audits against that deployed revision passed:

| Check | Result |
| --- | --- |
| Eight primary pages × three languages × three widths × two themes | 144/144, zero findings |
| Every published project/article page in the sitemap, mobile/dark | 42/42, zero findings |
| Language/RTL/filter transitions, keyboard/dialog access, storage restrictions, mocked contact and feedback retries | Six interaction groups passed, no browser exceptions |
| Public forms without JavaScript | Six form/language combinations passed; disabled until ready, POST fallback, visible explanation |
| No-JavaScript language navigation and direct mobile-filter URL | Passed |
| Active app/worker images | Both match the deployed revision; app readiness and public liveness returned 200 |
| Shared Afrimed, Lyvora production, and Lyvora preview | All returned 200 after rollout |
| New app/worker runtime logs | No matching runtime-error lines during the observed post-deployment window |

The matrix checks include unique combinations, successful responses, one main heading, loaded images, no horizontal overflow, no axe violations, no browser exceptions, and correct production canonicals/descriptions. The detail audit also checks locale and RTL direction. Representative desktop/mobile/tablet screenshots were visually reviewed, including the Arabic dark homepage, Arabic contact form, and illustrated English journal.

Evidence is saved locally in `web/artifacts/audits/acceptance-{320,768,1440,content,interactions}/`, with the aggregate `acceptance-summary.json`. An earlier live pass also completed 144 layout cases and 42 detail pages; expanding the retry test then exposed the rate-limit edge case, which was fixed and redeployed before this acceptance pass.

Only Lyvora's category was corrected in existing production content. The browser form audit intercepted all submissions; it created no enquiries/testimonials and sent no notifications. SMTP remains paused. The private authenticated dashboard was reviewed in source and its authorization/database boundaries in CI; no owner credentials were used for a manual MFA session. These results establish the checked scope, rather than a claim of universal perfection or human translation certification.
