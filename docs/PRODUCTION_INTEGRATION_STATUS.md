# Portfolio production integration — 2026-10-22

## Website audit deployment and repeat acceptance — 2026-10-24

Production now runs revision `b647b11a06b2235d793103fa6c02e2dfa5d4db1d`, deployed by successful workflow [40048937991](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio/actions/runs/40048937991). The blue slot is active; app/worker image identity, authenticated readiness, public liveness, and shared-site health were checked on the VPS.

See [the website audit report](WEBSITE_AUDIT_2026-10-24.md) for findings, remediation, and exact evidence. Final live acceptance passed 144 layout/language/theme cases, all 42 published detail pages, six interaction groups including mocked throttled retries, and six no-JavaScript form/language combinations. CI passed 21 unit/deployment tests and 19 browser tests plus database checks, build, lint, dependency audits, and image scans. No matching runtime errors appeared in the observed app/worker logs. SMTP remains paused. This supersedes the earlier deployed revisions below.

## Production deployment verified — 2026-10-24

The owner authorized deployment and error repair. Production workflow [40044551839](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio/actions/runs/40044551839) succeeded for commit `e0b494bec5343b228a7f3cdb95ec2937f09c23c2`: verification, immutable app/worker images, vulnerability scans, and shared-VPS deployment all passed. Linux verification included six passing unit/deployment test files, disposable database checks, the production build, 14 browser/accessibility journeys, and dependency audits.

Fixed the missing `portfolioContent` import introduced by the merge. Consolidated overlapping case studies so the existing detailed Watch Party, travel API, portfolio, and capability entries remain authoritative. Published only the three missing Lyvora, logistics foundations, and preview-release article entries in one insert-only transaction; existing production content was preserved. All nine new translations were confirmed published.

The blue production slot is active, using the above commit's immutable image tags. The application container is healthy; the worker is running. Authenticated readiness and public liveness returned 200. All 24 checked public routes (eight routes in each of English, French, and Arabic), including the new detail pages, returned successful HTML with headings. No matching runtime error lines appeared in the candidate app/worker logs during the first ten-minute log window. Afrimed, Lyvora production, and Lyvora preview health checks returned 200 after deployment. The previous portfolio slot remains available for rollback.

SMTP remains deliberately paused. This deployment did not send mail, change shared Auth configuration, or modify financial data. The content collection now contains ten projects, four articles, four milestones, one education entry, three skills, and three services. Earlier blocker statements below are historical and superseded by this live verification. Production HTTP and runtime checks do not constitute a manual Auth/MFA or contact-delivery acceptance test.

## QueenSMTP production readiness follow-up

The owner supplied the missing SMTP password and authorized its use. A mode-600 runtime file has been prepared outside the repository with QueenSMTP port 465/SSL, SMTP delivery enabled, the existing sender/recipient, Supabase server configuration and independent app secrets. No credential values are included here or in Git. The provided SSH private key and known-hosts file are also available outside the repository; this supersedes earlier statements that credentials were missing.

The worker accepts `EMAIL_DELIVERY_ENABLED` and the existing `SMTP_ENABLED` alias, rejects conflicts, and enforces the correct TLS mode for ports 465/587. The deployment script now checks SMTP TLS/authentication using the candidate image before starting services; this check sends no mail and never touches the outbox. The worker image explicitly contains the Node 24-compatible shared helper and verifier.

Current local checks passed: strict TypeScript, zero-warning lint, 17 unit/deployment tests, production build, app and worker Docker builds, read-only/network-free worker verifier smoke test, and deploy-script shell syntax. Production templates now target the approved domain/backend and QueenSMTP without containing private credentials. PR #23’s earlier verification completed successfully. Current workspace networking permits no outbound TCP destinations, and its TCP proxy is unavailable. Consequently live SSH, runtime installation, and QueenSMTP authentication cannot be verified from this session until access to the VPS on port 22 and QueenSMTP on port 465 is enabled. Uploaded JSON status descriptions are historical evidence, not a live check of the VPS. GitHub environment-variable access was rechecked and still returns HTTP 403; existing configured secrets cannot be read back. The owner explicitly deferred live access/authentication checks and will debug those later. No production deployment or notification send was performed.

## Deployment preparation follow-up

SMTP setup is explicitly deferred. `EMAIL_DELIVERY_ENABLED` defaults to `false`: the worker runs maintenance without claiming notification jobs; readiness no longer requires SMTP. Enquiries remain in the database/dashboard and jobs stay pending until delivery is enabled. Production CI now defaults to the approved project’s verified public browser URL and publishable key; paired environment overrides remain supported and staging has no production fallback.

Rechecked run `39773599441`: verification passed, image publication failed at missing browser configuration. GitHub environment-variable administration remains inaccessible (HTTP 403). This workspace has no configured VPS identity or runtime secrets, and no live rollout was performed. Required operator inputs remain the VPS SSH/known-host settings and protected runtime file, shared gateway integration, hosted admin/MFA/content checks and origin HTTPS validation. SMTP is not a deployment prerequisite while delivery is paused.


Local validation of this follow-up passed: strict TypeScript, lint with zero warnings, 12 unit/deployment tests, production build, 11 Chromium browser/accessibility journeys, and four workflow public-config resolution cases. This does not establish VPS/runtime readiness or successful image publication.

## Cloudflare and deployment update — 2026-10-22

Cloudflare is now connected. The owned portfolio zone is **brahim-elhouss.tech**, superseding the older .me hostname. Its apex A record points to **169.58.97.2**, matching the current Afrimed/Lyvora origin records; www is a proxied CNAME to the apex. Both records use Cloudflare proxying, and SSL mode is Full (strict). No staging DNS record was created.

See [the exact GitHub and VPS configuration checklist](CLOUDFLARE_VPS_SETUP.md). The image workflow now selects production by default and staging only on an explicit staging dispatch, removing the dependency on an unconfigured staging environment for production builds.

This session did not inspect/change the VPS, administer GitHub environment credentials, configure an origin certificate, or deploy the application. Earlier Cloudflare access blockers below are historical; SSH/runtime/gateway prerequisites remain outstanding.

## Applied and verified

The user explicitly selected reuse of the existing Supabase project after new-project creation failed at the two-active-free-project limit.

Production database: **budjetify**, project `hnlieepsxoqeebkreugt`, organization `yukwwkhpxqevquxgfevm`, region `eu-west-1`, URL `https://hnlieepsxoqeebkreugt.supabase.co`.

Applied `portfolio_foundation` using the reviewed foundation SQL in `web/supabase/migrations/20261021131652_portfolio_foundation.sql`. All ten portfolio table names and the application functions were checked for conflicts first. There were no pre-existing Storage buckets or policies. The migration grants service-role access to explicitly listed portfolio objects, not every object in the shared public schema.

Created ten portfolio tables with RLS, the `portfolio` public bucket, and the `drafts` private bucket. Existing financial tables, functions, users, and project-wide Auth configuration were not altered. No admin was created or content published.

Hosted verification passed for anonymous public reads and denial of admin status, unaffiliated authenticated-user membership visibility, service-side atomic contact/outbox creation, and submission deduplication. The complete write test was rolled back. Confirmed zero contact messages and outbox jobs afterward. This is not a completed Auth/MFA/Storage HTTP integration test or production rollout.

Security advisors report intentional policy-free RLS on service-only `rate_limits` and `legacy_imports`, plus disabled leaked-password protection in the shared Auth configuration. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Do not change shared Auth configuration without assessing the existing app.

## Shared-project constraints

Both apps share Supabase Auth, service-role privileges, compute, quotas, backups, and the public API schema. Portfolio admin authorization requires an explicit `admin_members` record plus AAL2; existing app users do not automatically gain portfolio admin access. This is logical application separation, not project-level security isolation. Do not disable public signup or replace redirects/SMTP for the existing mobile app. Add the portfolio callback URLs while preserving existing URLs when management access is available. Do not run destructive database tests against this project.

The separate staging/production-project recommendation in older documents is superseded by the user's production reuse decision. No staging target has been configured. Do not silently point staging imports/tests at this production project.

## Verified access blockers

- `gh` is authenticated as EL-HOUSS-BRAHIM and can write repository contents, create workflows, dispatch runs, and read CI. Its integration credential cannot administer Actions secrets or environment variables: API calls return HTTP 403, including setting `NEXT_PUBLIC_SUPABASE_URL` in `portfolio-production`.
- A temporary Budgetify credential-presence workflow was rejected before executing any steps because production permits only `backend-v*` tags. The workflow and run were deleted. No secret values were exposed or copied. Its create/remove commits remain in Git history. Do not fabricate a backend release tag merely to access environment secrets: existing release automation may react to it.
- No VPS SSH or Cloudflare credentials are configured in this execution environment. No VPS inspection, sibling gateway update, DNS change, or portfolio deployment has occurred.
- Latest inspected portfolio main CI run `39690850010` passed `verify`, failed production image publication at missing public browser configuration, cancelled staging image publication, and skipped deployment.

## Next actions

Supply GitHub environment administration access or set the production public variables and VPS credentials through a protected administrative channel. Retrieve the project's public publishable key through the connected Supabase tool; privileged service credentials must stay server-side. Configure runtime secrets, SMTP, exact Auth redirects, admin membership/MFA, and review/import content before rollout. Preserve the shared gateway integration in Budgetify and Afrimed source and inspect actual VPS capacity before deployment. Configure only the verified portfolio Cloudflare zone and records. The current workflow also builds staging: adjust deployment target selection before a production-only run rather than configuring staging to use production data accidentally.
