import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/page-intro";
import { isLocale } from "@/i18n/routing";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pages" });
  return pageMeta(
    locale,
    "/privacy",
    t("privacyTitle"),
    t("privacyDescription"),
  );
}
export default async function Privacy() {
  const t = await getTranslations("pages");
  return (
    <div className="container">
      <PageIntro label="PRIVACY" title={t("privacyTitle")} intro="" />
      <div className="prose">
        <p>{t("privacyBody")}</p>
      </div>
    </div>
  );
}
