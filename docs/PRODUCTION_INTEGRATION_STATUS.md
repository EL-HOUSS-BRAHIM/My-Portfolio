# Portfolio production integration — 2026-10-22

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
