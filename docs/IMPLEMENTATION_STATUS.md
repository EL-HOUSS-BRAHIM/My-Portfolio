# Implementation and Verification Status

## Implemented in the repository

- New `web/` application alongside the retained PHP site; strict TypeScript, Next.js/React, pinned dependencies/lockfile, generated database types.
- Quiet Exploration visual system, self-hosted Latin/Arabic typography, portrait, original vector project illustrations, responsive navigation, persistent light/dark/system themes.
- English/French/Arabic public pages, true RTL, project filtering/detail, About, Services, Journal/detail, contact, feedback, privacy, localized not-found states, legacy redirects, sitemap/hreflang, robots, structured Person data.
- Private dashboard with operator-provisioned Supabase sign-in, TOTP enrollment/challenge, server-side user verification, membership authorization, and AAL2 enforcement in application actions and database policies.
- Content/translation CRUD, locale publication, Markdown preview without raw HTML, image normalization, draft/public file upload, enquiries, testimonial moderation, email status, audit activity.
- Supabase migration with explicit grants/RLS, draft-translation isolation, private operational tables, persistent atomic rate limits, durable contact/outbox transaction, idempotent submission IDs, exclusive email job claiming and stale-claim recovery.
- SMTP worker with TLS, bounded retries, stable Message-ID, no visitor-supplied From, failure visibility, and sensitive-payload-free logs.
- Blue/green portfolio-only Compose deployment using the existing `budgetify-edge` network and shared deployment lock. Existing gateway integration is a prerequisite, not a replacement.
- Independent staging/production image builds, required CI checks, dependency/container scanning, and monthly Dependabot configuration.
- Dry-run/reconciled content and historical enquiry importers, legacy article exporter, private media migration, encrypted off-server backup tooling, and recovery/operations documentation.
- Legacy namespace import repairs, removal of default admin/sample endorsement initialization, a valid Composer security-hook target, and untracking of environment files while retaining their local copies.

## Verification performed

| Check | Result |
| --- | --- |
| Production Next.js build and TypeScript | Passed |
| ESLint, zero allowed warnings | Passed |
| Unit and portfolio deployment/rollback tests | 7 passed |
| Chromium browser/accessibility journeys | 11 passed, including authentication callback routing |
| PostgreSQL migration/RLS/MFA/draft/private-file checks | Passed |
| Concurrent job claiming and rate-limit quota checks | Passed |
| Main and minimal worker dependency audits | Zero reported vulnerabilities |
| Application and worker Docker builds | Passed |
| Read-only, non-root application container | Public pages and liveness returned 200; no browser runtime errors |
| Worker Node runtime syntax/permissions check | Passed |
| Trivy scans at HIGH/CRITICAL, ignoring unfixed findings | Both images passed with zero fixable findings |
| Compose configuration, Caddy route validation, shell syntax | Passed |
| Changed legacy PHP entry points and Composer hook | PHP 8.4 syntax checks passed |
| Legacy project import, staging seed, admin provisioner | Dry runs passed; no external writes |
| Legacy journal export | Three drafts exported for review |

Successful local checks do not establish production readiness. The database harness uses a disposable local PostgreSQL service; the deployment tests simulate success/failure with isolated command doubles and verify that only portfolio slots are stopped and shared gateway files are preserved. They do not execute a real VPS cutover. The runtime images omit npm, and the worker installs only its Supabase/SMTP/validation dependencies.

Review screenshots are saved in `docs/previews/home-desktop.png` and `docs/previews/home-arabic.png`, so they remain available after this execution workspace is replaced.

## Important limits and production gates

No live deployment, DNS change, hosted database migration, account creation, SMTP send, or production-data import has occurred. VPS/Cloudflare/SMTP access and portfolio runtime credentials were unavailable. Connected Supabase management access revealed active Budgetify and Lyvora Preview projects plus an inactive personal project; no dedicated portfolio project was identified, and none of those databases was modified. The default production hostname is `brahim-elhouss.me`; staging is `staging.brahim-elhouss.me`, pending actual zone/routing verification.

Both sibling gateway repositories must preserve the portfolio import and mount before the deployer can run. This implementation does not modify or publish Budgetify or Afrimed source. Inspect actual shared-host capacity and current gateway state before rollout.

Local database tests emulate Supabase Auth/Storage schemas on PostgreSQL. Hosted Auth session refresh/MFA enrollment, Storage requests, Supabase advisors, real SMTP delivery/outage recovery, backup restoration, external availability, field Core Web Vitals, and Lighthouse targets remain staging/production checks. Automated axe checks do not replace manual assistive-technology review.

Production copy, translations, case studies, résumé, and genuine testimonial consent need human review. Existing journal templates include TODOs/unverified personal claims, so they are exported as drafts rather than silently published. The résumé link remains omitted until a reviewed PDF is uploaded. No hiring availability, business metric, endorsement, or commercial outcome is invented.

The generic content model groups content kinds while translation rows, operational data, authorization, and media metadata remain separate. Dates/role details may be written in descriptions; additional structured temporal fields can be added through migrations if needed. Auth account provisioning uses the explicit operator script or Supabase dashboard; account recovery remains an administrative Supabase operation. This release has no public registration or custom recovery UI.

New application security does not retroactively harden the entire retained PHP codebase. Keep the legacy version restricted during transition and retire it after verified cutover. Removing environment files from the current tree does not remove Git history; rotate any confirmed exposed credentials separately.

See `PORTFOLIO_UPGRADE_PLAN.md`, `DESIGN.md`, `OPERATIONS.md`, and `MIGRATION.md` for the full recommendation, operational instructions, and remaining rollout gates.
