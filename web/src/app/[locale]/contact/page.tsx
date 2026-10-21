import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { PageIntro } from "@/components/page-intro";
import { ContactForm } from "@/components/contact-form";
import { hasSupabase } from "@/lib/env";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pages" });
  return pageMeta(locale, "/contact", t("contactTitle"), t("contactIntro"));
}
export default async function Contact() {
  const t = await getTranslations("pages"),
    h = await getTranslations("home");
  return (
    <div className="container">
      <PageIntro
        label="05 / CONTACT"
        title={t("contactTitle")}
        intro={t("contactIntro")}
      />
      <div className="contact-grid">
        <aside className="contact-aside">
          <h2 style={{ fontSize: 25 }}>Brahim El Houss</h2>
          <p>{h("location")}</p>
          <a href="https://github.com/EL-HOUSS-BRAHIM" className="text-link">
            GitHub ↗
          </a>
        </aside>
        <ContactForm enabled={hasSupabase()} />
      </div>
    </div>
  );
}
