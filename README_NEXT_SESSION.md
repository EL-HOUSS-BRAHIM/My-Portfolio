# Start Here — Next Session Handoff

**SMTP-deferred deployment update:** Delivery now defaults to paused (`EMAIL_DELIVERY_ENABLED=false`), readiness no longer requires SMTP, and production CI has verified public browser defaults. SMTP setup is deferred by the user. See production integration status for remaining VPS/runtime blockers.

**2026-10-22 update:** Read [production integration status](docs/PRODUCTION_INTEGRATION_STATUS.md) before the historical handoff below. The user authorized sharing the active `budjetify` Supabase project; the portfolio foundation has now been applied and hosted database checks passed. VPS/Cloudflare deployment remains blocked by credentials and GitHub environment permissions.

## Current goal and status

The portfolio redesign and application/infrastructure upgrade have been implemented in this repository. **Continue with staging integration and rollout, not a fresh rewrite.** The new application is in `web/`; the PHP site remains available as the migration/rollback source. This handoff accompanies the upgrade commit on `main`; run `git log -1` to identify the exact current revision.

The user wants:

- A calm, curious, approachable portfolio reflecting **Brahim El Houss**, with clear communication and mutual respect.
- Both employer and client audiences.
- English, French, and Arabic, including genuine RTL layouts.
- A private content dashboard with MFA.
- Hosting on the existing **shared VPS**, Supabase for database/Auth/Storage, and QueenSMTP or a compatible SMTP provider.
- Their name as the domain identity. The documented default is **brahim-elhouss.me**, with **staging.brahim-elhouss.me** proposed for staging. Confirm the actual Cloudflare records before changing them.

**No live deployment, DNS change, hosted database migration, SMTP send, production-data import, or sibling-repository modification has occurred.** A push may trigger CI; inspect the actual Actions results rather than assuming that local verification proves CI or production readiness.

## Read these documents in order

1. [Implementation and verification status](docs/IMPLEMENTATION_STATUS.md).
2. [Shared-VPS operations and rollout](docs/OPERATIONS.md).
3. [Data migration and cutover](docs/MIGRATION.md).
4. [Full upgrade recommendation plan](docs/PORTFOLIO_UPGRADE_PLAN.md).
5. [Design system](docs/DESIGN.md).

Review the [desktop preview](docs/previews/home-desktop.png) and [Arabic mobile preview](docs/previews/home-arabic.png). These are local demo screenshots, not evidence of a live deployment.

## Architecture and important paths

| Area | Location / behavior |
| --- | --- |
| Application | `web/`: Next.js App Router, React, strict TypeScript, Node 24 LTS |
| Public routes | `/en`, `/fr`, `/ar`; Work, About, Services, Journal, Contact, Privacy, feedback |
| Dashboard | `/{locale}/admin`; user verification, explicit DB membership, TOTP/AAL2 |
| Content | Separate `content` and `content_translations` tables; unpublished translations never appear in public query results |
| Schema | `web/supabase/migrations/20261021131652_portfolio_foundation.sql` |
| Database types | `web/src/lib/database.types.ts`, generated from the migration test schema |
| Submission flow | Validated same-origin API → atomic enquiry + outbox → SMTP worker |
| Worker | `web/scripts/email-worker.ts`; minimal dependency manifest/lockfile in `web/worker/` |
| Deployment | `deploy/compose.yaml`, `scripts/deploy-portfolio.sh`, shared gateway integration notes in `deploy/gateway/` |
| CI | `.github/workflows/ci-cd.yml`; verification, separate staging/production images, explicit manual deployment selection |
| Operations | `scripts/backup-portfolio.sh` plus import/media/backup/provision scripts under `web/scripts/` |

Local demo mode works without Supabase configuration and intentionally disables submission/admin functionality. Production/staging require configured services and fail readiness if required configuration is missing. Runtime images are non-root and omit npm; application deployments have no published host ports.

Legacy repairs include missing PHP namespace imports, removal of the default admin/sample endorsement seed, a valid Composer security hook, and removal of environment files from tracking. Local copies of those old environment files were retained and ignored. **Untracking files does not erase Git history**; rotate any confirmed exposed credentials separately. Do not print their values.

## Local setup and verification

Use Node **24 LTS**. From the repository root:

```bash
npm run setup
npm run dev
```

Open http://localhost:3000/en. Service configuration belongs in `web/.env.local`, copied from `web/.env.example`, never committed.

```bash
npm run typecheck
npm run lint
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Omit `CHROMIUM_PATH` if using Playwright-managed Chromium; install it with `cd web && npx playwright install chromium` when needed.

Database tests **reset their schemas**. Use only an explicitly disposable local PostgreSQL instance:

```bash
docker run -d --name portfolio-test-postgres \
  -e POSTGRES_PASSWORD=local-test-only \
  -p 127.0.0.1:55439:5432 postgres:17-alpine
cd web
TEST_DATABASE_URL=postgresql://postgres:local-test-only@127.0.0.1:55439/postgres npm run db:test
```

Wait for PostgreSQL readiness before the test. Afterwards, stop/remove only that named local test container and its anonymous volume. **Never point this test at a hosted Supabase project or the shared production server.**

Previous session results:

- Production build and strict TypeScript passed.
- Lint passed with zero allowed warnings.
- **7** unit/deployment tests passed.
- **11** Chromium browser/accessibility journeys passed, including all locales, RTL/mobile at 320px, theme persistence, no-JavaScript reading, and authentication callback routing.
- PostgreSQL RLS/MFA/draft isolation/private-file checks, contact deduplication, concurrent job claiming, and concurrent persistent quotas passed.
- Main and minimal worker dependency audits reported zero vulnerabilities.
- Application/worker Docker builds passed; read-only application runtime checks returned 200 and no browser runtime errors; worker runtime syntax/permissions passed.
- Trivy scans of both images passed with zero **fixable HIGH/CRITICAL** findings (`--ignore-unfixed`); this does not mean every possible vulnerability is absent.
- Caddy/Compose/YAML/shell checks and PHP 8.4 syntax checks passed.
- Import/seed/admin-provision dry runs passed; three legacy article drafts exported.

The SQL harness emulates Supabase Auth/Storage roles in PostgreSQL. Hosted Auth/MFA/session refresh, Storage requests, SMTP failure/recovery, real backup restore, manual accessibility, Lighthouse, and field performance remain deployment gates.

## Shared VPS: preserve the other applications

The VPS also hosts:

- [`EL-HOUSS-BRAHIM/afrimed-space`](https://github.com/EL-HOUSS-BRAHIM/afrimed-space), public presentation at `afrimed.space`.
- [`EL-HOUSS-BRAHIM/Budgetify`](https://github.com/EL-HOUSS-BRAHIM/Budgetify), private; its current README describes **Lyvora Android** previews. Do not confuse it with the earlier Budgetify web case study.
- Existing API routes: `lyvora.afrimed.space` and `lyvora-preview.afrimed.space`.

Inspected Afrimed gateway sources:

- `deploy/Caddyfile.gateway`.
- `deploy/compose.gateway.yaml`.
- `scripts/deploy-website.sh`.

These indicate a shared Caddy project using external network **`budgetify-edge`**, gateway directory **`~/budgetify/gateway`**, and shared deployment lock **`~/budgetify/deploy.lock`**. Inspect the actual VPS to confirm current state.

**Required integration before portfolio deployment:** preserve the portfolio Caddy import and read-only directory mount in BOTH gateway source-of-truth repositories. Afrimed and Budgetify deployments can overwrite gateway files. A one-off server edit alone will not survive future releases. See `deploy/gateway/shared-gateway.patch` for the exact additions; despite its extension it is an integration checklist, not an automatically applicable unified diff.

The portfolio deployer deliberately refuses to run without the import/mount. It uses the shared lock, isolated blue/green portfolio projects, resource caps, candidate readiness, full Caddy validation/reload, and sibling-site probes. Do not bind another proxy to 80/443, replace shared volumes/routes, restart unrelated apps, or run global Docker cleanup. Confirm spare capacity, including overlap during deployment.

## Connected services and missing configuration

- GitHub access was available for the portfolio and read-only sibling inspection.
- Connected Supabase management discovery found active **budjetify** and **Lyvora Preview**, plus an inactive **EL-HOUSS-BRAHIM's Project**. No dedicated portfolio project was identified. Do not reuse the active application databases or resume the inactive project on assumption.
- A Cloudflare account connection was not available; newly added domains could not be enumerated.
- VPS SSH, portfolio runtime keys, and SMTP account credentials were not configured in the execution environment.

Use connected tools to discover current access before requesting information again. Never print credentials, inspect secret bindings for their contents, or commit runtime env files.

## Prioritized next work

1. Inspect GitHub Actions for the pushed commit. Verification should run; image publication needs target configuration in GitHub environments **`portfolio-staging`** and **`portfolio-production`**. Do not claim cloud CI passed without checking it.
2. Select/provision dedicated staging and production Supabase projects, with the user's actual plan/region constraints. Review migrations and current Supabase docs/advisors. Apply to staging first; disable public signups and configure exact Auth redirects.
3. Configure external runtime secrets from `web/.env.example`. Build browser bundles with the same public Supabase project values used by the corresponding runtime. Configure separate environment variables in GitHub for staging and production; do not reuse a staging bundle for production.
4. Provision the admin with the explicit `web/scripts/provision-admin.ts` tool or a protected administrative process; enroll TOTP and test a hosted session. Its default is a dry run. Do not send invitation emails or create users accidentally.
5. Verify QueenSMTP's actual endpoint/account settings, sender DNS, TLS and delivery. Configure Supabase Auth SMTP separately. Test contact persistence during SMTP downtime and worker recovery without losing enquiries.
6. Inspect the real shared VPS and coordinate the two gateway source repositories. Do not edit other apps until their current canonical gateway/deployment paths are confirmed.
7. Confirm the user's Cloudflare zone/hostname, DNS/IP, Full (strict) SSL, staging access restriction, and cache exclusions for auth/admin/API. Default identity is Brahim El Houss / `brahim-elhouss.me`.
8. Reconcile real PHP/JSON/MySQL content, migrate to drafts, preserve timestamps/checksums, and review translations and claims. Legacy journal templates contain TODOs/unverified personal claims; do not publish them blindly. The résumé link stays omitted until a reviewed portable PDF is uploaded; the old `assets/resume.pdf` is an absolute local symlink.
9. Rehearse backup restoration and application rollback, verify all existing services, then deploy staging. Production cutover follows the documented acceptance gates; preserve enquiries during migration and retain the old site for at least 14 days.

Do not repeat the entire design/repository scan unless a new discrepancy requires it. Start with actual CI results and the concrete external integration blockers above.
