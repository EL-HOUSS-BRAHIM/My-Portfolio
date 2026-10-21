import { z } from "zod";
export const siteUrl = () =>
  z
    .url()
    .parse(process.env.SITE_URL || "http://localhost:3000")
    .replace(/\/$/, "");
export const hasSupabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export function publicConfig() {
  return z.object({ url: z.url(), key: z.string().min(10) }).parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
export function secretConfig() {
  return {
    ...publicConfig(),
    secret: z.string().min(10).parse(process.env.SUPABASE_SECRET_KEY),
  };
}
export function isDemo() {
  return (
    !hasSupabase() &&
    process.env.CONTENT_MODE !== "supabase" &&
    process.env.DEPLOY_ENV !== "production" &&
    process.env.DEPLOY_ENV !== "staging"
  );
}
