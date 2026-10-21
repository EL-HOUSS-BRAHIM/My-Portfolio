import { contentSchema, type Content } from "./models";
import type { Locale } from "@/i18n/routing";
export type TranslationRow = {
  locale: Locale;
  title: string;
  summary: string;
  body: string;
  published: boolean;
};
export function mapContent(row: Record<string, unknown>): Content {
  const translations = {
    en: { title: "Unavailable", summary: "", body: "", published: false },
    fr: { title: "Indisponible", summary: "", body: "", published: false },
    ar: { title: "غير متاح", summary: "", body: "", published: false },
  };
  for (const t of (row.content_translations || []) as TranslationRow[]) {
    if (t.locale in translations)
      translations[t.locale] = {
        title: t.title,
        summary: t.summary,
        body: t.body,
        published: t.published,
      };
  }
  const parsed = contentSchema.parse({ ...row, translations });
  return {
    ...parsed,
    id: String(row.id),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
