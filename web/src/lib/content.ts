import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient } from "./supabase/server";
import { isDemo } from "./env";
import type { Content } from "./models";
import type { Locale } from "@/i18n/routing";
import { mapContent } from "./database-map";
import { demoContent } from "./demo-content";
export const getContent = unstable_cache(
  async (): Promise<Content[]> => {
    if (isDemo()) return demoContent;
    const { data, error } = await publicClient()
      .from("content")
      .select("*,content_translations(*)")
      .order("sort_order");
    if (error) throw new Error("Published content unavailable");
    return data.map(mapContent);
  },
  ["portfolio-content"],
  { tags: ["content"], revalidate: 300 },
);
export async function published(kind: Content["kind"], locale: Locale) {
  return (await getContent()).filter(
    (c) => c.kind === kind && c.translations[locale]?.published,
  );
}
