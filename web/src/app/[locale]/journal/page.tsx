import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { published } from "@/lib/content";
import { PageIntro } from "@/components/page-intro";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pages" });
  return pageMeta(locale, "/journal", t("journalTitle"), t("journalIntro"));
}
export default async function Journal({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("pages");
  const posts = await published("post", locale);
  return (
    <div className="container">
      <PageIntro
        label="04 / JOURNAL"
        title={t("journalTitle")}
        intro={t("journalIntro")}
      />
      {posts.length ? (
        <section className="section">
          {posts.map((c) => (
            <article className="journal-item" key={c.id}>
              <p className="eyebrow">{c.tags.join(" / ")}</p>
              <h2>
                <Link href={`/journal/${c.slug}`}>
                  {c.translations[locale].title} ↗
                </Link>
              </h2>
              <p>{c.translations[locale].summary}</p>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p>{t("emptyJournal")}</p>
          <Link href="/work" className="text-link">
            {t("back")} ↗
          </Link>
        </div>
      )}
    </div>
  );
}
