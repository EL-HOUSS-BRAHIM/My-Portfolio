import Image from "next/image";
import { ArrowDown, ArrowUpRight, Compass, MoveUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { published } from "@/lib/content";
import { ProjectCard } from "@/components/project-card";
import { pageMeta } from "@/lib/seo";
import { siteUrl } from "@/lib/env";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "home" });
  return pageMeta(
    locale,
    "",
    "Brahim El Houss — Software Engineer",
    t("intro"),
  );
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("home");
  const projects = (await published("project", locale))
    .filter((p) => p.featured)
    .slice(0, 3);
  const posts = (await published("post", locale)).slice(0, 3);
  const testimonials = await published("testimonial", locale);
  const settings = (await published("settings", locale)).find(
    (c) => c.slug === "profile",
  );
  const intro = settings?.translations[locale];
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" />
            {t("eyebrow")}
          </p>
          <h1>{intro?.title || t("title")}</h1>
          <p className="hero-intro">{intro?.summary || t("intro")}</p>
          <div className="hero-actions">
            <Link href="/work" className="button">
              {t("primary")}
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/about" className="text-link">
              {t("secondary")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="location">
            <span className="tiny-cross" aria-hidden>
              ✳
            </span>
            {t("location")}
          </p>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star star-one" aria-hidden>
            ✳
          </span>
          <span className="art-star star-two" aria-hidden>
            +
          </span>
          <div className="portrait-frame">
            <Image
              src="/images/portrait.webp"
              alt="Brahim El Houss"
              fill
              priority
              sizes="(max-width: 760px) 75vw, 400px"
            />
          </div>
          <div className="portrait-label">
            <Compass size={18} />
            <span dir="ltr">
              Casablanca, MA
              <br />
              <strong>33.57° N · 7.59° W</strong>
            </span>
          </div>
          <span className="art-coordinate" aria-hidden>
            THE ART OF FIGURING THINGS OUT
          </span>
        </div>
      </section>
      <div className="container hero-bottom">
        <span>{t("note")}</span>
        <a href="#selected" aria-label={t("selected")}>
          <ArrowDown size={18} />
        </a>
      </div>
      <section id="selected" className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / {t("explore")}</p>
            <h2>{t("selected")}</h2>
            <p>{t("selectedSub")}</p>
          </div>
          <Link className="text-link" href="/work">
            {t("allWork")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} {...{ project, locale, index }} />
          ))}
        </div>
      </section>
      <section className="approach section">
        <div className="container">
          <p className="eyebrow">
            02 /{" "}
            {locale === "ar"
              ? "النهج"
              : locale === "fr"
                ? "L’APPROCHE"
                : "THE APPROACH"}
          </p>
          <div className="section-heading">
            <div>
              <h2>{t("approach")}</h2>
              <p>{t("approachSub")}</p>
            </div>
            <Compass className="compass" size={58} strokeWidth={1} />
          </div>
          <div className="principles">
            {(t.raw("principles") as string[]).map((title, i) => (
              <article key={title}>
                <span className="principle-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{(t.raw("principleBodies") as string[])[i]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {posts.length > 0 && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                03 /{" "}
                {locale === "ar"
                  ? "ملاحظات وتقارير"
                  : locale === "fr"
                    ? "NOTES ET RAPPORTS"
                    : "NOTES & REPORTS"}
              </p>
              <h2>
                {locale === "ar"
                  ? "التفكير وراء العمل"
                  : locale === "fr"
                    ? "La réflexion derrière le travail"
                    : "The thinking behind the work"}
              </h2>
            </div>
            <Link className="text-link" href="/journal">
              {locale === "ar"
                ? "المدونة"
                : locale === "fr"
                  ? "Carnet"
                  : "Journal"}{" "}
              ↗
            </Link>
          </div>
          <div className="principles">
            {posts.map((c) => (
              <article key={c.id}>
                <p className="eyebrow">{c.tags.join(" / ")}</p>
                <h3>
                  <Link href={`/journal/${c.slug}`}>
                    {c.translations[locale].title} ↗
                  </Link>
                </h3>
                <p>{c.translations[locale].summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {testimonials.length > 0 && (
        <section className="section container">
          <h2>
            {locale === "ar"
              ? "كلمات من العمل المشترك"
              : locale === "fr"
                ? "Regards sur notre collaboration"
                : "Words from working together"}
          </h2>
          <div className="principles">
            {testimonials.map((c) => (
              <figure key={c.id}>
                <blockquote>
                  <p>{c.translations[locale].body}</p>
                </blockquote>
                <figcaption>{c.translations[locale].title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <section className="section container contact-banner">
        <p className="eyebrow">
          04 /{" "}
          {locale === "ar"
            ? "لنتواصل"
            : locale === "fr"
              ? "ÉCHANGEONS"
              : "SAY HELLO"}
        </p>
        <div>
          <h2>{t("contactTitle")}</h2>
          <Link
            href="/contact"
            className="round-link"
            aria-label={t("contactCta")}
          >
            <MoveUpRight size={35} strokeWidth={1.5} />
          </Link>
        </div>
        <p>{t("contactBody")}</p>
        <Link href="/contact" className="text-link">
          {t("contactCta")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Brahim El Houss",
            jobTitle: "Software Engineer",
            url: siteUrl(),
            sameAs: ["https://github.com/EL-HOUSS-BRAHIM"],
            address: {
              "@type": "PostalAddress",
              addressLocality: "Casablanca",
              addressCountry: "MA",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
