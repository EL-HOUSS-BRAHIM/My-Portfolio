# Data migration and cutover

## Source of truth

The repository contains PHP content, JSON files and MySQL schema definitions, not a verified production export. Do not assume one source is complete or newer. Export production data through an authorized backup connection, compare it against the JSON/PHP content, and record conflicts before importing. No production content has been imported by this implementation.

Keep exports encrypted and outside Git. Do not place contact data, password hashes, tokens, or image blobs in a public PR or build artifact.

## Content import

The importer accepts a JSON array or a plural property such as `projects`, `education`, or `skills`. It maps legacy IDs to deterministic UUIDs, preserves valid timestamps, records checksums, and defaults every translation to an unpublished draft. Re-running an identical import skips mapped records; a changed source record stops for reconciliation rather than overwriting dashboard edits.

```bash
cd web
npm run import:legacy -- --source ../data/projects.json --kind project --report /tmp/projects.import-report.json
```

After reviewing conflicts and selecting a dedicated staging project:

```bash
node --env-file=.env.local --import tsx scripts/import-legacy.ts --source /secure/reconciled-projects.json --kind project --apply --reconciled --report /secure/projects.import-report.json
```

Inspect the generated report, target counts, ordering, source links, timestamps, and drafts. The importer does not migrate sample testimonials or shared admin credentials. All imported descriptions are source material for editorial review, not independently verified claims.

The curated website fixtures can seed a **dedicated staging** project with `node --env-file=.env.local --import tsx scripts/seed-content.ts --apply` when `DEPLOY_ENV=staging`. They describe the old Budgetify web project separately from current Lyvora mobile releases. Do not seed production with untranslated or unverified content.

## Images and binary data

Export MySQL image blobs as binary files using an authorized database tool. Preserve a manifest mapping each blob to its legacy record and original MIME type. Reject unsupported formats or corrupt data before uploading.

```bash
cd web
npx tsx scripts/migrate-media.ts /secure/exported-image.png
node --env-file=.env.local --import tsx scripts/migrate-media.ts /secure/exported-image.png --apply
```

The tool validates/normalizes an image, names it by source SHA-256, writes it to private draft Storage, and reports source/output checksums. Verify dimensions and visual output. Normalization deliberately changes the output checksum; keep both. The tool does not silently publish draft objects or assign expired signed links to public content. Upload reviewed public copies through the dashboard and attach their public URLs.

The old `assets/resume.pdf` is an absolute symlink to a developer machine. Do not migrate that link. Verify the actual résumé PDF and its content, upload a public reviewed copy, and place its URL in the `profile` settings record's résumé/demo URL field. Until then the new UI omits the résumé link.

## Enquiries and testimonials

Historical contact messages are personal data. Import them only from a verified export through a reviewed database script retaining IDs/timestamps/status/consent provenance. Do not enqueue notifications for historical enquiries. Use `web/scripts/import-enquiries.ts --source /secure/contact-export.json` for a dry run, then add `--apply --reconciled` after review. The JSON array (or `contact_messages` property) must include original ID, name, email, message, status, and a valid original timestamp. The tool records `origin=legacy`, leaves consent unknown rather than manufacturing it, preserves timestamps, and never creates email jobs. Its report contains counts, not personal message content.

Do not publish the sample “John Doe”/“Jane Smith” testimonials from initialization SQL. Existing real testimonials require authenticity and publication consent checks. New feedback enters pending moderation; approval records the review, while a separately curated testimonial content record controls public wording/translations.

## Rehearsal checklist

- Back up the source MySQL database, uploads, and environment configuration.
- Reconcile JSON/PHP/MySQL conflicts and retain the decision record.
- Dry-run content imports and checksum media; reconcile row/file counts.
- Check timestamps, ordering, genuine project claims, attribution, résumé, and links.
- Verify anonymous public reads cannot expose unpublished translation bodies or private files.
- Test invited admin login/MFA, uploads, preview, and publication.
- Verify contact persistence while SMTP is down, then worker recovery and bounded retry.
- Check English/French/Arabic pages, RTL layout, redirects, metadata, and sitemap.
- Restore an encrypted backup into a separate compatible recovery project.
- Confirm spare VPS capacity, shared proxy integration, domain/SSL and all sibling services.

## Final cutover

Freeze legacy content edits and testimonial submissions briefly. Keep enquiries flowing through the old durable handler or a tested forwarding adapter and record a cutover timestamp. Import final approved content, publish reviewed translations, and reconcile all messages received during the migration window. Switch only the portfolio route after readiness checks.

Keep legacy files and source backups for at least 14 days. Application rollback restores routing/images, not database history. Preserve all newly received enquiries before restoring any database snapshot. Retire PHP services, old API paths, and credentials only after the observation period and explicit verification that they are no longer serving traffic.

## Legacy journal templates

The existing articles include unfinished TODO placeholders and personal claims that need review. Export them with `python web/scripts/export-legacy-posts.py /secure/posts.draft.json`, then dry-run `import-legacy.ts --source /secure/posts.draft.json --kind post`. They remain drafts until verified. Old article URLs lead to their equivalent new article when published, or to the journal index while unavailable, rather than inventing content or returning a broken page.
