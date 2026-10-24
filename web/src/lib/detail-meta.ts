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
  const metadata = pageMeta(
    locale,
    `/${kind === "project" ? "work" : "journal"}/${slug}`,
    text.title,
    text.summary,
    (["en", "fr", "ar"] as Locale[]).filter(
      (l) => item!.translations[l].published,
    ),
  );
  const images =
    item!.image && !item!.image.endsWith(".svg")
      ? [{ url: item!.image, alt: text.title }]
      : undefined;
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      ...(kind === "post"
        ? {
            type: "article" as const,
            authors: ["Brahim El Houss"],
            modifiedTime: item!.updated_at,
          }
        : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      ...metadata.twitter,
      ...(images ? { images: images.map((image) => image.url) } : {}),
    },
  };
}
