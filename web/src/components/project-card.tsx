import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Content } from "@/lib/models";
import type { Locale } from "@/i18n/routing";
export function ProjectCard({
  project,
  locale,
  index = 0,
}: {
  project: Content;
  locale: Locale;
  index?: number;
}) {
  const text = project.translations[locale];
  return (
    <article className={`project-card project-${index % 3}`}>
      <Link
        href={`/work/${project.slug}`}
        className="project-image-link"
        aria-label={text.title}
      >
        <div className="project-image">
          {project.image ? (
            <Image
              src={project.image}
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 55vw"
              className="project-photo"
            />
          ) : (
            <div className="project-placeholder">
              {project.slug.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="image-number" aria-hidden>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="project-open" aria-hidden>
            <ArrowUpRight size={24} />
          </span>
        </div>
      </Link>
      <div className="project-meta">
        <span className="eyebrow">{project.tags.slice(0, 3).join(" / ")}</span>
        <h3>
          <Link href={`/work/${project.slug}`}>{text.title}</Link>
        </h3>
        <p>{text.summary}</p>
      </div>
    </article>
  );
}
