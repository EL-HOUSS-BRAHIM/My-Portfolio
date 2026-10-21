import { createClient } from "@supabase/supabase-js";
import { demoContent } from "../src/lib/demo-content";
if (!process.argv.includes("--apply")) {
  console.info(
    `Dry run: ${demoContent.length} curated projects. Use --apply only for a dedicated staging project.`,
  );
  process.exit(0);
}
if (process.env.DEPLOY_ENV !== "staging")
  throw new Error(
    "Seed is restricted to staging. Use the dashboard to publish reviewed production content.",
  );
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
for (const item of demoContent) {
  const { error } = await db.rpc("save_content", { payload: item });
  if (error) throw new Error(`Seed failed: ${item.slug}`);
}
console.info("Staging seed complete.");
