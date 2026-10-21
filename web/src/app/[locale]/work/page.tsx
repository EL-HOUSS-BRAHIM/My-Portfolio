import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { published } from "@/lib/content";
import { WorkGrid } from "@/components/work-grid";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pages" });
  return pageMeta(locale, "/work", t("workTitle"), t("workIntro"));
}
export default async function Work({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("pages");
  return (
    <div className="container">
      <PageIntro
        label="01 / PORTFOLIO"
        title={t("workTitle")}
        intro={t("workIntro")}
      />
      <WorkGrid projects={await published("project", locale)} locale={locale} />
    </div>
  );
}
