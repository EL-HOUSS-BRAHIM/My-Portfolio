# Operations — Shared VPS

## Current boundaries

The shared gateway source was inspected in `EL-HOUSS-BRAHIM/afrimed-space`. It serves `afrimed.space`, `lyvora.afrimed.space`, and `lyvora-preview.afrimed.space`, uses `budgetify-edge`, and serializes deployments with `~/budgetify/deploy.lock`. Budgetify's private README now presents Lyvora Android releases. Repository configuration is evidence of the intended architecture, not proof of current VPS state.

The portfolio default production hostname is **brahim-elhouss.me**, matching the user's name and existing repository documentation. Use `staging.brahim-elhouss.me` for staging only after confirming Cloudflare zone ownership and DNS. No Cloudflare account connection or VPS/service credentials were available in this session, so no live records, migrations, or traffic were changed.

## Before provisioning

1. Inspect the actual VPS: existing Compose projects, gateway mounts/configuration, listening ports, free RAM/disk/CPU, and backup arrangements. Do not start another web proxy or change system firewall rules on assumption.
2. Budget **768 MB / 0.75 CPU for the app** and **256 MB / 0.25 CPU for the worker**, with extra headroom for blue/green overlap. These are isolation caps; the VPS needs capacity for Lyvora and Afrimed too. Build images in CI, never on the production VPS.
3. Use `/home/budgetify/portfolio` as the portfolio deployment directory and preserve all existing application directories and volumes.
4. Pin deployment SSH host keys and use a dedicated restricted deployment identity. Access to the Docker socket is privileged; protect it accordingly.

## Shared gateway integration — required once

Both Afrimed website deployment and Budgetify deployment manage gateway source. A portfolio-only live edit would be erased by their next release. Coordinate and commit these additions in **both** canonical gateway sources before enabling deployment:

- Append `import /etc/caddy/portfolio/*.caddy` to the shared Caddyfile.
- Add `/home/budgetify/portfolio/gateway:/etc/caddy/portfolio:ro` to the existing proxy service volumes.
- Preserve every other site, proxy target, volume, network, and global option.
- Keep the imported directory mounted rather than a single file so route replacement is visible without recreating the gateway.

`deploy/gateway/shared-gateway.patch` records the additions; it is an integration checklist, not an automatically applied diff. The portfolio deployment script checks both additions and refuses to proceed if absent. This repo does not silently edit or publish either sibling repository.

Acquire the existing `~/budgetify/deploy.lock` during gateway work. Validate the **full existing configuration** before reloading Caddy. Check Afrimed and both Lyvora health endpoints before and after integration. Do not run `docker compose down`, `docker system prune`, volume deletion, or a proxy replacement.

If Cloudflare proxies the hostname, configure Caddy's trusted proxy ranges from Cloudflare's current published IPv4/IPv6 list and use strict forwarded-IP parsing. Preserve existing global settings. The portfolio overwrites `X-Portfolio-Client-IP` at its reverse proxy; never trust a caller-supplied copy. Confirm the observed address before enabling per-IP limits. Only the gateway can reach the app over the private edge network.

## Supabase setup

Use separate staging and production projects. Connected management discovery found Budgetify and Lyvora Preview plus an inactive personal project, with no clearly dedicated portfolio project. Preserve those applications; do not repurpose their databases or resume the inactive project on assumption. Do not point tests/import rehearsal at production.

1. Configure `web/.env.local` locally or an external mode-600 secret file on the VPS. Never commit it. Set `CONTENT_MODE=supabase` and exact `SITE_URL` values.
2. Read CLI help for your pinned version (`npx supabase --help`, `npx supabase db push --help`). Link the intended staging project deliberately. Review the migration diff and run `db push --dry-run` before applying it. Do not run reset commands on a linked project.
3. Apply `web/supabase/migrations` to staging, review Supabase security advisors, and verify grants/RLS with anonymous, non-admin, admin AAL1, and admin AAL2 requests. The local SQL test harness emulates Auth/Storage roles; it is not a replacement for hosted integration verification.
4. Disable public signup in the hosted Auth dashboard. Set exact site and redirect URLs (`https://HOST/auth/callback`). Provision a confirmed user with a strong password through an authorized administrative tool. `web/scripts/provision-admin.ts` defaults to a dry run; with `--apply` and external `PORTFOLIO_ADMIN_EMAIL` / `PORTFOLIO_ADMIN_PASSWORD` variables, it creates the account and membership without sending invitation email. Never commit those values. Remove the provisioning password from the external file after secure handoff.
5. If using an existing account instead of the provisioner, insert only its UUID into `public.admin_members` using an administrative connection: `insert into public.admin_members(user_id) values ('YOUR-AUTH-USER-UUID');`. No password or default user is seeded.
6. Sign in at `/en/admin/login`, enroll an authenticator, and verify MFA. Membership is checked from the database, not editable metadata. Content actions and RLS require AAL2.
7. Configure custom Auth SMTP independently of the app's SMTP. Confirm password recovery/email links using current Supabase Auth guidance. Account provisioning and recovery remain Supabase-dashboard operations in this release.
8. Generate and compare database types with `npx supabase gen types typescript --linked --schema public`. Never hand-edit generated types as the source of truth.

Database publication changes must use reviewed migrations. Prefer additive, backwards-compatible changes before a traffic switch. The service key is restricted to server submission handlers, the worker, importer, and operational tools.

## SMTP

QueenSMTP uses `smtp.queensmtp.com`: port **465** requires `SMTP_SECURE=true`; port **587** requires `SMTP_SECURE=false` (STARTTLS). Certificate validation and TLS 1.2 minimum stay enabled. Configure exactly one notification recipient. The current enquiry notifications contain no attachments and stay below the provider’s 1 MB limit.

Credentials belong only in the mode-600 VPS runtime file. Set `EMAIL_DELIVERY_ENABLED=true` once they are ready. The earlier `SMTP_ENABLED` flag is supported for existing runtime files; if both flags are present they must agree. Prefer the canonical flag in new configuration. Never copy a credential export into the repository.

The deployer runs a no-send SMTP verification in the new worker image before starting the candidate services. When paused it skips SMTP; when enabled it checks TLS and authentication and stops rollout on failure. It never claims jobs or sends a test email. This verifies connection/authentication, not sender-domain authorization or final inbox delivery.

To run that check manually against the active slot’s protected env file:

```bash
docker compose --project-name portfolio-production-blue \
  --env-file /home/budgetify/portfolio/releases/production-blue.env \
  -f /home/budgetify/portfolio/compose.yaml run --rm --no-deps \
  worker node scripts/verify-smtp.ts --if-enabled
```

Use the slot recorded in `releases/production.current`. The check reports only a success/failure event; credentials and raw provider errors are not logged. A fresh image containing `smtp-config.ts` and `verify-smtp.ts` is required; do not reuse an older worker image.

SMTP is optional for initial deployment. Leave `EMAIL_DELIVERY_ENABLED=false` (the default) in the runtime env file. The application readiness check requires its database and core configuration, without SMTP. The worker keeps database maintenance running but does not claim email jobs, consume retries, or attempt delivery. Contact enquiries and notification jobs remain stored atomically; read enquiries in the private dashboard while delivery is paused.

When ready, fill the SMTP fields below, set `EMAIL_DELIVERY_ENABLED=true`, and recreate only the active portfolio slot's worker using its saved release selector, for example:

```bash
docker compose --project-name portfolio-production-blue \
  --env-file /home/budgetify/portfolio/releases/production-blue.env \
  -f /home/budgetify/portfolio/compose.yaml up -d --no-deps --force-recreate worker
```

Replace `blue` with the slot recorded in `releases/production.current`. Review the pending backlog before enabling: queued enquiries will then be delivered. Invalid enabled SMTP configuration fails worker startup; an SMTP outage still uses the existing retry limits. Custom Supabase Auth SMTP is separate and shared Auth settings must remain intact.

Set the actual QueenSMTP (or compatible provider) host/port, TLS mode, username/password, verified `SMTP_FROM`, and `CONTACT_TO`. Use port 587 with STARTTLS or the provider's documented implicit-TLS port; never disable certificate verification. Set SPF, DKIM, DMARC. Use real delivery tests to verify sender identity and provider limits.

The contact API saves an enquiry and outbox record atomically and returns 202. The worker delivers asynchronously, with six bounded attempts and recovery of abandoned claims. Delivery is **at least once**: a crash after SMTP acceptance can cause a duplicate. A stable Message-ID helps mail clients but does not guarantee exactly-once SMTP delivery. Failures remain visible in the dashboard and structured logs.

The application does not send visitor acknowledgements by default, reducing unsolicited mail and bounce risk. If introduced later, localize and test them separately.

## Build and images

CI uses Node 24, an exact npm lockfile, a disposable PostgreSQL service, required tests, and image scanning. Main builds publish immutable images only after required checks pass:

- `ghcr.io/el-houss-brahim/portfolio:COMMIT_SHA`
- `ghcr.io/el-houss-brahim/portfolio-worker:COMMIT_SHA`

Configure public Supabase URL and publishable key as GitHub **environment variables** in separate `portfolio-staging` and `portfolio-production` environments for the image builds. These are browser configuration, not privileged secrets. Runtime must use the **same public project configuration** as the image. Build staging and production images against their respective projects; do not reuse a staging bundle containing its public configuration for production. Production is the default build target; staging is selected only by an explicit staging dispatch. Image names are: staging uses `portfolio-staging:SHA` and `portfolio-worker-staging:SHA`; production uses `portfolio:SHA` and `portfolio-worker:SHA`. Production defaults to the approved shared project’s public browser configuration when neither override is set; partial overrides and missing staging configuration fail. Never pass service/SMTP secrets as build arguments.

The Dockerfile supports a BuildKit `proxy_ca` secret for managed environments. CI using ordinary network trust does not need it. An example managed build is `docker build --secret id=proxy_ca,src="$CODEX_PROXY_CERT" --target app -t portfolio:test web`. TLS verification stays enabled.

## Deployment

Prepare `~/portfolio/compose.yaml` from `deploy/compose.yaml` and a protected runtime secret file. Copy `deploy/.env.example` to an external release selector file; set the exact image SHA, hostname, secret-file path, and environment. Staging and production must have different secrets and project credentials.

Protect staging with Cloudflare Access before opening it publicly. Supply a mode-600 `PORTFOLIO_CURL_CONFIG` file containing monitor/service-token headers if deployment probes need Access authentication. Never disable TLS or bypass Access globally. Staging also returns noindex headers and a restrictive robots file.

The GitHub workflow can deploy on a manual main-branch run by selecting `staging` or `production`; its default is `build-only`. Configure `VPS_HOST`, `VPS_USER=budgetify`, `VPS_KNOWN_HOSTS`, `PORTFOLIO_DOMAIN`, the public Supabase variables, and secret `VPS_SSH_KEY` in the matching GitHub environment. Authenticate the VPS to read its GHCR images beforehand if they are private. Staging CI probes expect `~/portfolio/secrets/staging-curl.conf` for Cloudflare Access. Required tests and image scans run before the deployment job.

Alternatively, run the deployer only after migration rehearsal and shared gateway integration:

```bash
bash scripts/deploy-portfolio.sh /home/budgetify/portfolio/releases/staging.env
```

The deployer:

1. Acquires the same shared lock as Afrimed/Lyvora deployments.
2. Checks the pre-existing gateway import, mount, network, and configuration.
3. Starts an isolated blue/green portfolio project with no published ports.
4. Waits for authenticated readiness, preserving the current slot.
5. Writes only the portfolio route, validates the full Caddy config, and reloads.
6. Probes the new site, Afrimed, and both Lyvora health endpoints.
7. Restores the previous portfolio route on failure; stops only the old portfolio slot after success.

Database migration and DNS changes are intentionally outside this script. Do not use it before the one-time integration is preserved in sibling repositories. Port 80/443 and Caddy storage remain owned by the existing gateway.

## Cloudflare and cutover

Create or update only the portfolio hostname's A/AAAA records to the verified VPS address. Do not copy an old IP from a README without checking the VPS. Do not alter Afrimed/Lyvora records. Use Full (strict) SSL and a valid origin certificate. Bypass caching for admin, API, auth callbacks, and any response setting session cookies. Public page caching remains in the application; do not apply a blanket “Cache Everything” rule.

Review production translations/content, verify the résumé, reconcile database/media imports, run live SMTP tests, then switch routing. Keep legacy files/backups available for at least 14 days. Preserve contact intake during the final import and reconcile messages arriving during any rollback.

## Rollback

Keep `~/portfolio/releases/ENV-blue.env`, `ENV-green.env`, and `ENV.previous.caddy`, plus immutable images. Under the shared deploy lock, start the previous portfolio project from its saved selector and the same Compose file. Confirm readiness, restore only the previous portfolio route, validate/reload the shared Caddy, verify all sites, then stop the failed portfolio slot. Update `ENV.current` to the restored slot.

Application rollback does not reverse schema changes. Use backwards-compatible migrations or a reviewed recovery procedure. Preserve new enquiries and outbox records before any data restore; never discard them by restoring a stale database blindly.

## Backups and restoration

Use the chosen Supabase plan's managed backups **and independent Storage backups**. Database backups alone do not include object contents.

`scripts/backup-portfolio.sh` runs `pg_dump` for application/Auth/Storage metadata, downloads both buckets with SHA-256 manifests, encrypts the archive with `age`, and uploads it to off-server storage over pinned SSH. It requires operator-provided PostgreSQL `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSFILE`, CA trust, `BACKUP_AGE_RECIPIENT`, `BACKUP_REMOTE`, and a protected `PORTFOLIO_BACKUP_ENV` for Storage API credentials. No password is passed on the command line. Use a scoped backup identity where supported.

Schedule once daily and alert on nonzero exit. On the backup destination, retain 30 daily snapshots and six monthly snapshots using that service's lifecycle policy. A successful upload is not evidence of restore readiness.

Quarterly, decrypt a backup into a restricted temporary directory, verify its manifest, and restore into an isolated compatible recovery project. Auth/Storage schemas require a Supabase-compatible restore procedure and appropriate privileges; do not restore platform schemas into a running project without following current Supabase restore guidance. `web/scripts/storage-backup.ts BACKUP_DIR --restore --apply` verifies and restores objects into empty destination buckets. Test login, published content, drafts, enquiries, and file checksums. Record elapsed time and result. Initial RPO: 24 hours; RTO: four hours. Select PITR if those targets are inadequate.

## Monitoring and maintenance

- External uptime monitor for portfolio and existing shared services.
- Daily alert for failed/exhausted email jobs, old pending jobs, backup age, database/storage quotas, disk use, and container restarts.
- Forward JSON logs to the operator's monitoring system; never log contact payloads, secrets, or raw IPs.
- Docker JSON logs are size-rotated. Configure the collector for **14-day retention**; size rotation alone is not a time-retention guarantee.
- The worker purges old rate keys and archived enquiries. Operators review and archive closed enquiries within 12 months; active cases require a documented retention exception. Pending feedback needs review/deletion if not published.
- Dependency updates monthly, urgent security patches promptly, quarterly restore drills, and capacity review before adding services.
- Remove an admin's membership immediately to revoke application authorization, and revoke Auth sessions as well. Membership checks are live, not JWT-metadata based.

## Remaining production prerequisites

Verified VPS access/capacity, Cloudflare account/zone/host routing, independent Supabase projects and credentials, SMTP credentials and sender DNS, shared gateway additions committed in both sibling source repositories, production data export/reconciliation, reviewed translations/content, résumé replacement, hosted Auth/Storage tests, SMTP outage/retry rehearsal, image scan results, and a real backup/restore rehearsal.
