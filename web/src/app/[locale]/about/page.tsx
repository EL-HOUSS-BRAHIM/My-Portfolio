import Image from "next/image";
import ReactMarkdown from "react-markdown";
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
  return pageMeta(locale, "/about", t("aboutTitle"), t("aboutIntro"));
}
export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("pages"),
    h = await getTranslations("home");
  const education = await published("education", locale);
  const experience = await published("experience", locale);
  const skills = await published("skill", locale);
  const about = (await published("settings", locale)).find(
    (c) => c.slug === "about",
  );
  const settings = (await published("settings", locale)).find(
    (c) => c.slug === "profile",
  );
  return (
    <div className="container">
      <PageIntro
        label="02 / BRAHIM"
        title={about?.translations[locale].title || t("aboutTitle")}
        intro={about?.translations[locale].summary || t("aboutIntro")}
      />
      <div className="about-grid">
        <div className="about-photo">
          <Image
            src="/images/portrait.webp"
            alt="Brahim El Houss"
            fill
            sizes="(max-width: 760px) 90vw, 500px"
          />
        </div>
        <div className="about-copy">
          <p>{about?.translations[locale].body || t("aboutBody")}</p>
          <h2>{t("education")}</h2>
          {education.length ? (
            education.map((c) => (
              <p key={c.id}>
                {c.translations[locale].title}
                <br />
                {c.translations[locale].summary}
              </p>
            ))
          ) : (
            <p>{t("educationBody")}</p>
          )}
          {settings?.demo_url && (
            <a className="text-link" href={settings.demo_url}>
              {locale === "ar"
                ? "السيرة الذاتية"
                : locale === "fr"
                  ? "Télécharger le CV"
                  : "Download résumé"}{" "}
              ↗
            </a>
          )}
          <Link className="text-link" href="/contact">
            {h("contactCta")} ↗
          </Link>
        </div>
      </div>
      {experience.length > 0 && (
        <section className="section">
          <h2>
            {locale === "ar"
              ? "محطات المسار"
              : locale === "fr"
                ? "Étapes du parcours"
                : "Journey milestones"}
          </h2>
          <p className="timeline-note">
            {locale === "ar"
              ? "محطات تستند إلى تاريخ المستودعات، وليست تواريخ توظيف."
              : locale === "fr"
                ? "Des étapes fondées sur les dépôts, pas des dates d’emploi."
                : "Milestones from repository history, rather than employment dates."}
          </p>
          <ol className="timeline">
            {experience.map((c) => (
              <li key={c.id}>
                <span className="eyebrow">{c.category}</span>
                <div>
                  <h3>{c.translations[locale].title}</h3>
                  <p>{c.translations[locale].summary}</p>
                  <div className="milestone-detail">
                    <ReactMarkdown>{c.translations[locale].body}</ReactMarkdown>
                  </div>
                  {c.source_url && (
                    <a
                      className="text-link"
                      href={c.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("source")} ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {skills.length > 0 && (
        <section className="section">
          <h2>
            {locale === "ar"
              ? "القدرات"
              : locale === "fr"
                ? "Compétences"
                : "Capabilities"}
          </h2>
          <div className="principles">
            {skills.map((c) => (
              <article key={c.id}>
                <h3>{c.translations[locale].title}</h3>
                <p>{c.translations[locale].summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <h2>{t("valuesTitle")}</h2>
        <div className="principles">
          {(h.raw("principles") as string[]).map((s, i) => (
            <article key={s}>
              <span className="principle-number">0{i + 1}</span>
              <h3>{s}</h3>
              <p>{(h.raw("principleBodies") as string[])[i]}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
