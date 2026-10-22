# Portfolio domain and deployment configuration — 2026-10-22

## Cloudflare configured

- Zone: brahim-elhouss.tech
- A: brahim-elhouss.tech -> 169.58.97.2, proxied, automatic TTL
- CNAME: www.brahim-elhouss.tech -> brahim-elhouss.tech, proxied
- SSL mode: Full (strict)
- Address verified against current afrimed.space and both Lyvora API DNS records.
- DNS configuration does not install the application or its origin certificate.

## GitHub environment

Create/configure `portfolio-production` under repository Settings > Environments.

| Type | Name | Value |
| --- | --- | --- |
| Secret | VPS_SSH_KEY | Private SSH key authorized for budgetify on the VPS. The existing Budgetify deployment key can be entered here if it authorizes that account; its value cannot be read/copied from GitHub secrets. |
| Variable | VPS_HOST | 169.58.97.2 |
| Variable | VPS_USER | budgetify |
| Variable | VPS_KNOWN_HOSTS | Verified SSH known_hosts entry for the VPS; confirm its fingerprint through the VPS console or trusted existing configuration. |
| Variable | PORTFOLIO_DOMAIN | brahim-elhouss.tech |
| Variable | NEXT_PUBLIC_SUPABASE_URL | https://hnlieepsxoqeebkreugt.supabase.co |
| Variable | NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public publishable key for the approved shared production project. |

`GITHUB_TOKEN` is supplied by Actions; no manual token is needed for image publication. A Cloudflare API token is not required by the SSH deployment workflow.

Push/build-only builds production images. A manual staging run builds only staging images and requires a separately configured `portfolio-staging` environment/backend. A manual production run builds only production images, so missing staging configuration cannot block production publication.

## VPS runtime configuration

Provision an external mode-600 file at:
`/home/budgetify/portfolio/secrets/production.env`

Use `web/.env.example` as the exact runtime schema:
- SITE_URL=https://brahim-elhouss.tech
- DEPLOY_ENV=production
- CONTENT_MODE=supabase
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY matching the image build
- SUPABASE_SECRET_KEY: privileged server key for the approved project
- RATE_LIMIT_SECRET and HEALTH_TOKEN: independently generated random secrets
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CONTACT_TO

Keep runtime credentials on the server, outside the repository and image builds. The current workflow does not upload runtime secrets from GitHub.

## Server integration still required

The VPS has not been inspected or changed by this session. No SSH credential is available here.
Before a deployment:
1. Inspect capacity, existing gateway configuration/mounts, and budgetify-edge.
2. Preserve the import and directory mount from `deploy/gateway/shared-gateway.patch` in both Afrimed and Budgetify gateway sources and apply them to the existing server under its shared deploy lock.
3. Create the portfolio gateway and secrets directories. Authenticate the VPS for GHCR image pulls if images are private.
4. Configure the production application route and a valid origin certificate for brahim-elhouss.tech. Add a www-to-apex HTTPS redirect if www is used.
5. Add the portfolio Auth callback to shared Supabase redirects while preserving existing mobile-app settings. Complete admin/MFA, runtime, SMTP and content verification described in OPERATIONS.md and PRODUCTION_INTEGRATION_STATUS.md.
6. Run Portfolio quality and immutable images manually on main with deploy_environment=production after these prerequisites are ready.

DNS has been configured; deployment and public HTTPS readiness are not yet verified.
