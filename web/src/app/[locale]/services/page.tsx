import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { PageIntro } from "@/components/page-intro";
import { Link } from "@/i18n/navigation";
import { published } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pages" });
  return pageMeta(locale, "/services", t("servicesTitle"), t("servicesIntro"));
}
export default async function Services({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("pages"),
    h = await getTranslations("home");
  const content = await published("service", locale);
  const services = content.length
    ? content.map((c) => c.translations[locale])
    : (t.raw("serviceTitles") as string[]).map((title, i) => ({
        title,
        summary: (t.raw("serviceBodies") as string[])[i],
      }));
  return (
    <div className="container">
      <PageIntro
        label="03 / SERVICES"
        title={t("servicesTitle")}
        intro={t("servicesIntro")}
      />
      <div className="service-list">
        {services.map((s, i) => (
          <article className="service-row" key={s.title}>
            <span className="eyebrow">0{i + 1}</span>
            <h2 style={{ fontSize: 28 }}>{s.title}</h2>
            <p>{s.summary}</p>
          </article>
        ))}
        <Link className="button" href="/contact">
          {h("contactCta")} ↗
        </Link>
      </div>
    </div>
  );
}
