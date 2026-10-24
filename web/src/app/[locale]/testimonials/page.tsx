import { TestimonialForm } from "@/components/testimonial-form";
import { PageIntro } from "@/components/page-intro";
import { hasSupabase } from "@/lib/env";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "form" });
  return {
    ...pageMeta(
      locale,
      "/testimonials",
      t("feedbackTitle"),
      t("feedbackIntro"),
    ),
    robots: { index: false, follow: true },
  };
}
export default async function Testimonials() {
  const t = await getTranslations("form");
  return (
    <div className="container">
      <PageIntro
        label={t("feedbackLabel")}
        title={t("feedbackTitle")}
        intro={t("feedbackIntro")}
      />
      <div className="prose">
        <noscript>
          <p className="form-notice">{t("javascript")}</p>
        </noscript>
        <TestimonialForm enabled={hasSupabase()} />
      </div>
    </div>
  );
}
