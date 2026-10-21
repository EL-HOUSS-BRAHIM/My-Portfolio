# Portfolio Redesign and Infrastructure Upgrade

Reviewed repository: `EL-HOUSS-BRAHIM/My-Portfolio` at `d8a2d58385263c53d9299313646129fd11672566`.

## Goal and constraints

Create a distinctive, calm, understandable portfolio for employers and clients, with an English/French/Arabic public site and a private publishing dashboard. Host the application on the existing VPS, use managed Supabase for PostgreSQL/Auth/Storage, and use QueenSMTP or another authenticated SMTP provider.

**Shared-host correction:** the VPS also serves Afrimed Space and Budgetify/Lyvora. Reuse its Caddy gateway, `budgetify-edge` network, and `~/budgetify/deploy.lock`. Never introduce a second proxy on ports 80/443, overwrite shared gateway routes, or restart/prune other applications. Domain selection remains configurable until Cloudflare ownership/routing is confirmed.

## Assessment

The architectural scan covered the inventory, public PHP pages, frontend assets, representative APIs and authentication, MySQL schema, configuration, CI/deployment, backup scripts, tests, and stored desktop screenshots. Approximately 621 files include vendor and generated code. This is not a line-by-line security audit. The live homepage was blocked by the workspace proxy; production VPS and database state were not available.

| Finding | Recommendation |
| --- | --- |
| Dense timeline, bright gradients, competing cards | Quiet Exploration visual system and focused navigation |
| Multiple config/database/validation systems | One typed application and service boundary |
| PHP, JSON, MySQL content drift | Reconciled import into one publishing database |
| Missing namespace imports | Repair legacy entry points while retaining rollback |
| Per-request rate-limit state | Atomic PostgreSQL rate limits |
| Ignored test failures | Required checks before immutable image publication |
| Replacement deploy loses `.env` | External secret files and blue/green application slots |
| Different server paths/PHP versions | One documented isolated Compose deployment |
| Ignored lockfiles and missing security hook | Committed lockfile and a valid legacy guard |
| Broken absolute résumé symlink | Reviewed, portable PDF in Storage |
| Environment files tracked | Untrack while preserving local copies; rotate confirmed exposed credentials |
| Default admin/sample endorsements | Remove from production initialization |

## Design and content

Use ivory/charcoal/forest colors, generous whitespace, self-hosted Manrope/Noto Sans Arabic, restrained motion, and real project evidence. Publish a warm introduction and positive working values. The hero emphasizes curiosity and care. See `DESIGN.md` for tokens and interaction rules.

Pages: Home, Work, Project detail, About, Services, Journal, Article detail, Contact, Privacy, feedback submission, and private Admin. Highlight three projects, explain capabilities through evidence, keep the homepage concise, and move detailed background into About.

Use `/en`, `/fr`, `/ar`, with `/` defaulting to English. Preserve the equivalent page when switching locale. Arabic uses true RTL layouts and logical CSS. Translate labels, forms, errors, content, and metadata. Publication is independent per locale, with English required before translated publication. Missing translations have an explicit English link and no indexing.

Target WCAG 2.2 AA, keyboard/screen-reader usability, 320px mobile layouts, 200% zoom, reduced-motion support, and verified contrast. Avoid invented testimonials, metrics, credentials, and experience claims. Human review of all content and translations is a production gate.

## Architecture

Strict TypeScript, Next.js App Router, React, Tailwind/design tokens, next-intl, Radix dialog primitives, Zod, Supabase, and Nodemailer. Use supported Node.js LTS and pinned stable dependency versions. Keep one repository and a small dedicated email worker; no extra backend framework is needed.

Server-render primary content. Cache only public data and invalidate it after publication. Keep admin/session responses private. Sanitize Markdown by disallowing embedded HTML and executable MDX. Use a private application membership allowlist and MFA. Never use user-editable metadata for authorization or expose privileged keys to clients.

### Data

Use shared content entities for projects/posts/skills/education/experience/services/settings/testimonials, with separate translation rows. Additional tables cover admin membership, enquiries, testimonial moderation, email outbox, rate limits, media metadata, import mappings, and audit events. Use UUIDs, timestamps, constraints, foreign keys, and indexes. Enable RLS with explicit grants on every exposed table.

Anonymous reads see only published translations; enquiries and operational records stay private. Store files in Supabase Storage rather than MySQL blobs. Keep draft assets private; publishing a Storage file is an explicit action.

### Interfaces

- `POST /api/contact`: same-origin validated consented enquiry, atomic persistence plus outbox, idempotent submission ID, persistent rate limits.
- `POST /api/testimonials`: consented feedback awaiting moderation, no public image uploads.
- `GET /api/health/live`: minimal process response.
- Token-protected readiness: configuration and database availability, no sensitive details.
- Authenticated server actions: content CRUD, previews, translations, moderation, uploads, enquiry state.
- Permanent legacy page redirects; explicit retirement responses for old PHP APIs.

### Email

Configure SMTP host/port/TLS/auth/from/recipient in external secrets. Use a domain-controlled From and visitor Reply-To. Set SPF/DKIM/DMARC. Configure Supabase auth SMTP separately. A worker atomically claims outbox jobs, retries transient failures, records exhausted deliveries, and never discards an enquiry because email failed. SMTP delivery is at least once; a crash after sending can produce a duplicate notification.

## VPS and delivery

Use resource-limited, non-root containers and immutable GHCR images. No public application ports. Keep staging and production Supabase/Auth/Storage credentials separate. Integrate portfolio routing into both existing gateway source repositories before live deployment so future Afrimed or Lyvora releases cannot erase it. Restrict staging with Cloudflare Access and set noindex.

CI requires types, lint, unit tests, migrations/RLS tests, production build, browser/accessibility journeys, dependency audit, and image scanning. Live deployment is an explicit operator action after prerequisites. Reuse the shared deploy lock, check candidate readiness, validate/reload existing Caddy, verify portfolio and existing services, and restore the old portfolio route on failure.

Keep secrets outside image layers and Git; pin SSH host keys. Never disable host verification or use global Docker cleanup. Confirm spare VPS memory/CPU before adding the application; current caps are budgets, not evidence of capacity.

## Migration and rollout

1. Stabilize critical legacy issues and take a restorable MySQL/upload backup.
2. Validate visual foundation, homepage, case-study template, and Arabic RTL.
3. Prepare staging platform, migrations, MFA, RLS, media, and SMTP.
4. Complete dashboard, localized public pages, and durable contact delivery.
5. Reconcile PHP/JSON/MySQL differences, dry-run imports, verify row counts/timestamps/media checksums/links.
6. Rehearse final import, redirects, security, accessibility, delivery, backup restore, and rollback.
7. Freeze content briefly, preserve contact intake, import final changes, switch traffic, monitor.
8. Retain the legacy application for at least 14 days, then retire it deliberately.

Do not import shared default admin credentials or unverified sample testimonials. Imports default to unpublished drafts and require an explicit reconciled flag before writes. Migrate image blobs/files separately into private Storage. Never infer missing production content from fixtures.

## Support and acceptance

Target field p75 LCP <=2.5s, INP <=200ms, CLS <=0.1; mobile Lighthouse performance >=90 and accessibility/best-practices/SEO >=95 on representative pages. Verify field metrics after launch rather than claiming them from a build.

Test unauthorized users, MFA enforcement, draft isolation, public/private media, malformed/oversized/cross-origin inputs, persistent rate limits, contact deduplication, SMTP failure/retry, concurrent job claims, redirects, hreflang/sitemaps, Arabic overflow, keyboard navigation, and no-JavaScript reading.

Use encrypted off-server database and Storage backups. Retain daily copies 30 days and monthly copies six months; test restoration quarterly. Initial RPO 24h and RTO 4h, with PITR required for tighter recovery. Monitor availability, errors, resources, outbox backlog, and backup freshness. Review dependencies monthly and urgent vulnerabilities promptly.

Default retention: enquiries 12 months unless active client records justify longer, operational logs 14 days, abuse identifiers 30 days. Record exceptions rather than silently retaining everything. Budget VPS, Supabase, SMTP, backups, and monitoring separately; confirm current plan features and prices before purchasing.

Production acceptance requires a tested application rollback and database/Storage restore, working SMTP, reviewed translations and content, a verified résumé, an actual domain, reconciled production data, shared-gateway changes preserved in both source repositories, and capacity checks. Existing services must stay healthy through deployment.

## References

- https://supabase.com/docs
- https://supabase.com/changelog
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/auth-mfa
- https://www.w3.org/TR/WCAG22/
- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
