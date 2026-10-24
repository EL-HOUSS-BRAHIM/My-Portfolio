import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
export function pageMeta(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  available: Locale[] = ["en", "fr", "ar"],
): Metadata {
  return {
    title: title.includes("Brahim El Houss") ? { absolute: title } : title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(available.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: { en: "en_US", fr: "fr_FR", ar: "ar_MA" }[locale],
    },
    robots:
      process.env.DEPLOY_ENV === "staging"
        ? { index: false, follow: false }
        : undefined,
  };
}
