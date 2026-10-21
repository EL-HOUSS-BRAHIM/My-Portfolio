import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import type { Locale } from "@/i18n/routing";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.DEPLOY_ENV === "staging") return [];
  const base = siteUrl();
  const locales: Locale[] = ["en", "fr", "ar"];
  const paths = [
    "",
    "/work",
    "/about",
    "/services",
    "/journal",
    "/contact",
    "/privacy",
  ];
  const staticEntries = paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })),
  );
  const entries = (await getContent())
    .filter((c) => c.kind === "project" || c.kind === "post")
    .flatMap((c) => {
      const ls = locales.filter((l) => c.translations[l].published);
      const path = `/${c.kind === "project" ? "work" : "journal"}/${c.slug}`;
      return ls.map((l) => ({
        url: `${base}/${l}${path}`,
        lastModified: c.updated_at,
        alternates: {
          languages: Object.fromEntries(
            ls.map((locale) => [locale, `${base}/${locale}${path}`]),
          ),
        },
      }));
    });
  return [...staticEntries, ...entries];
}
