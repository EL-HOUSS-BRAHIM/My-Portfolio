# Brahim El Houss — Portfolio

A calm, multilingual portfolio and private publishing dashboard. The new TypeScript application lives in **`web/`**. The PHP application remains in place for migration and rollback; no live server or DNS was changed by this upgrade.

**New session:** read [README_NEXT_SESSION.md](README_NEXT_SESSION.md) first for the current state, verified checks, shared-VPS constraints, and next steps.

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
- Durable contact storage and email outbox with a separate SMTP worker; no direct browser email or privileged keys.
- Docker images, gated CI, isolated shared-VPS deployment, migrations, dry-run import tools, and operational runbooks.

## Shared VPS

The VPS also hosts **Afrimed Space** and **Budgetify / Lyvora**. The portfolio uses the existing `budgetify-edge` network and `~/budgetify/deploy.lock`. It does **not** bind ports 80/443, replace the shared proxy, modify other application containers, or prune Docker resources.

Integrate the portfolio Caddy import and read-only directory mount into **both existing gateway source repositories** before deployment. The portfolio deployer refuses to run without them. See [Operations](docs/OPERATIONS.md) and [gateway integration](deploy/gateway/shared-gateway.patch).

The domain remains configurable. Cloudflare account access, VPS credentials, SMTP credentials, a selected Supabase project, and production data were not available in this workspace.

## Documents

- [Upgrade plan](docs/PORTFOLIO_UPGRADE_PLAN.md)
- [Implementation and verification status](docs/IMPLEMENTATION_STATUS.md)
- [Design system](docs/DESIGN.md)
- [Operations, deployment, backup and recovery](docs/OPERATIONS.md)
- [Data migration](docs/MIGRATION.md)

Do not publish translations, testimonials, résumé claims, or case-study outcomes before reviewing their accuracy. The current curated projects describe the older Budgetify web project separately from the newer Lyvora Android product.
