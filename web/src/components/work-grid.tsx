"use client";
import { useState } from "react";
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
  const [filter, setFilter] = useState("all");
  const t = useTranslations("filters");
  return (
    <>
      <div className="filters" role="group" aria-label={t("all")}>
        {(["all", "web", "backend", "systems"] as const).map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="projects-grid work-grid">
        {projects
          .filter((p) => filter === "all" || p.category === filter)
          .map((project, index) => (
            <ProjectCard key={project.id} {...{ project, locale, index }} />
          ))}
      </div>
    </>
  );
}
