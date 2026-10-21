import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
export async function ContentDetail({
  locale,
  slug,
  kind,
}: {
  locale: Locale;
  slug: string;
  kind: "project" | "post";
}) {
  const item = (await getContent()).find(
    (p) => p.slug === slug && p.kind === kind,
  );
  if (!item) {
    if (
      kind === "post" &&
      [
        "day-in-life-moroccan-developer",
        "my-journey-from-physics-to-code",
        "portfolio-deep-dive",
      ].includes(slug)
    )
      redirect(`/${locale}/journal`);
    notFound();
  }
  const t = await getTranslations("pages");
  const text = item.translations[locale];
  if (!text?.published) {
    if (!item.translations.en.published) notFound();
    return (
      <div className="container section">
        <h1>{t("missing")}</h1>
        <Link
          className="text-link"
          href={`/${kind === "project" ? "work" : "journal"}/${slug}`}
          locale="en"
        >
          {t("english")} ↗
        </Link>
      </div>
    );
  }
  return (
    <article className="container">
      <div className="page-intro">
        <Link
          className="text-link"
          href={kind === "project" ? "/work" : "/journal"}
        >
          ←{" "}
          {kind === "project"
            ? t("back")
            : locale === "ar"
              ? "المدونة"
              : locale === "fr"
                ? "Carnet"
                : "Journal"}
        </Link>
        <div className="tags">
          {item.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <h1>{text.title}</h1>
        <p>{text.summary}</p>
      </div>
      <div className="case-links">
        {item.source_url && (
          <a
            className="text-link"
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
          >
            {t("source")} ↗
          </a>
        )}
        {item.demo_url && (
          <a
            className="text-link"
            href={item.demo_url}
            target="_blank"
            rel="noreferrer"
          >
            {t("demo")} ↗
          </a>
        )}
      </div>
      {item.image && (
        <div className="case-image">
          <Image
            src={item.image}
            alt={text.title}
            fill
            sizes="(max-width: 760px) 100vw, 1180px"
          />
        </div>
      )}
      <div className="prose">
        <ReactMarkdown>{text.body}</ReactMarkdown>
      </div>
    </article>
  );
}
