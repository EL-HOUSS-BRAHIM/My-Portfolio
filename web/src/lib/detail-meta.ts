import { getContent } from "./content";
import { isLocale, type Locale } from "@/i18n/routing";
import { pageMeta } from "./seo";
export async function detailMeta(
  params: Promise<{ locale: string; slug: string }>,
  kind: "project" | "post",
) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const item = (await getContent()).find(
    (c) => c.kind === kind && c.slug === slug,
  );
  const text = item?.translations[locale];
  if (!text?.published)
    return {
      title: "Translation unavailable",
      robots: { index: false, follow: true },
    };
  return pageMeta(
    locale,
    `/${kind === "project" ? "work" : "journal"}/${slug}`,
    text.title,
    text.summary,
    (["en", "fr", "ar"] as Locale[]).filter(
      (l) => item!.translations[l].published,
    ),
  );
}
