"use client";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProjectCard } from "./project-card";
import type { Content } from "@/lib/models";
import type { Locale } from "@/i18n/routing";
export function WorkGrid({
  projects,
  locale,
}: {
  projects: Content[];
  locale: Locale;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const categories = ["all", "web", "mobile", "backend", "systems"] as const;
  const requested = search.get("category");
  const filter = categories.find((key) => key === requested) || "all";
  const visible = projects.filter(
    (p) => filter === "all" || p.category === filter,
  );
  const t = useTranslations("filters");
  return (
    <>
      <div className="filters" role="group" aria-label={t("all")}>
        {categories.map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={filter === key}
            onClick={() => {
              const params = new URLSearchParams(search);
              if (key === "all") params.delete("category");
              else params.set("category", key);
              router.replace(params.size ? `${path}?${params}` : path, {
                scroll: false,
              });
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <p className="filter-count" role="status" aria-live="polite">
        {t("count", { count: visible.length })}
      </p>
      <div className="projects-grid work-grid">
        {visible.map((project, index) => (
          <ProjectCard key={project.id} {...{ project, locale, index }} />
        ))}
      </div>
    </>
  );
}
