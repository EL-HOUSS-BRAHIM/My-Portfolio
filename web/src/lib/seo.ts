import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "./env";
export function pageMeta(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  available: Locale[] = ["en", "fr", "ar"],
): Metadata {
  const searchTitles: Record<string, Record<Locale, string>> = {
    "": {
      en: "Brahim El Houss — Software Engineer in Casablanca",
      fr: "Brahim El Houss — Ingénieur logiciel à Casablanca",
      ar: "Brahim El Houss — مهندس برمجيات في الدار البيضاء",
    },
    "/about": {
      en: "About Brahim El Houss",
      fr: "À propos de Brahim El Houss",
      ar: "عن Brahim El Houss",
    },
    "/work": {
      en: "Software Engineering Projects",
      fr: "Projets de développement logiciel",
      ar: "مشاريع تطوير البرمجيات",
    },
    "/services": {
      en: "Software Development Services",
      fr: "Services de développement logiciel",
      ar: "خدمات تطوير البرمجيات",
    },
    "/journal": {
      en: "Software Engineering Journal",
      fr: "Carnet de développement logiciel",
      ar: "مدونة تطوير البرمجيات",
    },
    "/contact": {
      en: "Contact Brahim El Houss",
      fr: "Contacter Brahim El Houss",
      ar: "تواصل مع Brahim El Houss",
    },
  };
  title = searchTitles[path]?.[locale] || title;
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
      url: `/${locale}${path}`,
      siteName: "Brahim El Houss",
      images: [
        {
          url: "/social-preview.png",
          width: 1200,
          height: 630,
          alt: "Brahim El Houss — Software Engineer",
        },
      ],
      locale: { en: "en_US", fr: "fr_FR", ar: "ar_MA" }[locale],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/social-preview.png"],
    },
    robots:
      process.env.DEPLOY_ENV === "staging"
        ? { index: false, follow: false }
        : undefined,
  };
}

export function contentUrl(
  locale: Locale,
  kind: "project" | "post",
  slug: string,
) {
  return `${siteUrl()}/${locale}/${kind === "post" ? "journal" : "work"}/${slug}`;
}
