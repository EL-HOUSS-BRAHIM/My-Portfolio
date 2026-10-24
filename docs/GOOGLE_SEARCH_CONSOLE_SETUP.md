# Google Search Console — current Next.js site

Updated 2026-10-24. This guide replaces the legacy PHP instructions.

## Completed live

- Domain property: `sc-domain:brahim-elhouss.tech`.
- Ownership verified through an additive Cloudflare apex TXT record. Keep that record to retain verification. No Google access to the Cloudflare account was delegated.
- Submitted `https://brahim-elhouss.tech/sitemap.xml`. Google reports **Success**, with **63 discovered pages**.
- HTTP and www requests resolve to the HTTPS apex site, whose root redirects to `/en`.
- Live crawl of all 63 sitemap URLs: HTTP 200, one H1, descriptions, and matching self-canonical URLs passed.

## Application changes prepared locally

The active application is in `web/`. Root PHP files and their robots/sitemap assets are legacy sources and do not configure the running Next.js site.

- Shared metadata includes an absolute Open Graph URL, site name, a 1200 × 630 PNG preview and explicit Twitter large-image cards.
- Published article pages include BlogPosting JSON-LD and article Open Graph metadata; dates use only recorded update timestamps. No publication dates are invented.
- Raster content covers override the shared preview; SVG covers retain the PNG social fallback.
- Admin and authentication routes have explicit noindex headers. Existing staging crawl/index blocking remains in place.
- Optional `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` runtime variables support HTML verification. Neither is required for the DNS-verified Google domain property.

## After deployment

1. Open the Search Console domain property and inspect `https://brahim-elhouss.tech/en`, `/fr` and `/ar`.
2. Run a live URL test, then request indexing for the main pages if available. Avoid repeated requests for the same URL.
3. Review Pages and Performance after Google has collected data. Read discovered pages as discovery, not proof of indexing.
4. Review Core Web Vitals when field data is available. A local browser check does not establish field performance.
5. Validate an article with Google's Rich Results Test after the new metadata is deployed.

Search Console verification and sitemap submission do not guarantee ranking or indexing. No Analytics tracking, paid services, business listings, or extra account access was configured.

## Repeat the audit

From `web/`, run `node scripts/audit-seo.mjs`. Optional `AUDIT_URL` selects another origin; `CHROMIUM_PATH` selects an installed Chromium browser. Results are written to ignored `artifacts/audits/seo/live.json`. The command reads public routes only.

## References

- [Google: Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start)
- [Google: sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: indexing FAQ](https://developers.google.com/search/help/crawling-index-faq)
