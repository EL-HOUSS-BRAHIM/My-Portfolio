# Brahim El Houss — Portfolio

A calm, multilingual portfolio and private publishing dashboard. The TypeScript application lives in **`web/`** and is deployed at [brahim-elhouss.tech](https://brahim-elhouss.tech/en). The PHP application remains as the legacy migration/rollback source.

The [October 24 website audit](docs/WEBSITE_AUDIT_2026-10-24.md) records the fixes, successful deployment, and repeat live acceptance results.

**New session:** read [README_NEXT_SESSION.md](README_NEXT_SESSION.md) first for the current state, verified checks, shared-VPS constraints, and next steps.

See [production integration status](docs/PRODUCTION_INTEGRATION_STATUS.md) for the shared Supabase project now provisioned and remaining rollout blockers.

## Local development

Use **Node.js 24 LTS**.

```bash
npm run setup
npm run dev
```

Open http://localhost:3000/en. English, French, and Arabic routes are included. Without service configuration, local development renders curated repository content and deliberately disables submissions and admin access. It never pretends to save a message.

To connect a dedicated staging Supabase project, copy `web/.env.example` to `web/.env.local`, fill in the real values, and set `CONTENT_MODE=supabase`. Set `SITE_URL` to the exact origin used in your browser. Apply migrations using the procedure in [Operations](docs/OPERATIONS.md), disable public sign-ups, invite your admin account, and add its ID to `admin_members`. The dashboard enforces authenticator MFA.

```bash
npm run typecheck
npm run lint
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e # omit CHROMIUM_PATH for Playwright-managed Chromium
```

Database verification uses a **disposable** PostgreSQL database:

```bash
cd web
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/portfolio_test npm run db:test
```

This command resets its test schemas. Never point it at a production or linked Supabase database.

## Application

- Next.js App Router, React, strict TypeScript, Tailwind/design tokens, next-intl.
- Server-rendered project pages; responsive navigation, filters, light/dark/system themes.
- Supabase PostgreSQL with row-level security, separate per-language publication, private admin membership, MFA, and audit events.
- Private dashboard: content CRUD, Markdown preview, translations, image normalization, public/private uploads, enquiries, moderation, and delivery status.
- Durable contact storage and email outbox with optional SMTP delivery (paused by default); no direct browser email or privileged keys.
- Docker images, gated CI, isolated shared-VPS deployment, migrations, dry-run import tools, and operational runbooks.

SMTP can be configured later: leave `EMAIL_DELIVERY_ENABLED=false`. Enquiries remain available in the dashboard and email jobs stay pending. See [SMTP operations](docs/OPERATIONS.md#smtp) to enable delivery.

## Shared VPS

The VPS also hosts **Afrimed Space** and **Budgetify / Lyvora**. The portfolio uses the existing `budgetify-edge` network and `~/budgetify/deploy.lock`. It does **not** bind ports 80/443, replace the shared proxy, modify other application containers, or prune Docker resources.

Integrate the portfolio Caddy import and read-only directory mount into **both existing gateway source repositories** before deployment. The portfolio deployer refuses to run without them. See [Operations](docs/OPERATIONS.md) and [gateway integration](deploy/gateway/shared-gateway.patch).

The domain remains configurable. Production is deployed behind the shared gateway with the approved Supabase backend; SMTP delivery remains paused. See the production integration status for the current verified release and historical rollout notes.

## Documents

- [Upgrade plan](docs/PORTFOLIO_UPGRADE_PLAN.md)
- [Implementation and verification status](docs/IMPLEMENTATION_STATUS.md)
- [Design system](docs/DESIGN.md)
- [Operations, deployment, backup and recovery](docs/OPERATIONS.md)
- [Data migration](docs/MIGRATION.md)

Do not publish translations, testimonials, résumé claims, or case-study outcomes before reviewing their accuracy. The current curated projects describe the older Budgetify web project separately from the newer Lyvora Android product.
