/** Explicit operator provisioning; no shared account and no unsolicited invitation email. */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
if (!process.argv.includes("--apply")) {
  console.info(
    "Dry run. Configure PORTFOLIO_ADMIN_EMAIL and PORTFOLIO_ADMIN_PASSWORD in an external secret file, then use --apply against the intended project. No account was created.",
  );
  process.exit(0);
}
const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(10),
    PORTFOLIO_ADMIN_EMAIL: z.email(),
    PORTFOLIO_ADMIN_PASSWORD: z.string().min(16),
  })
  .parse(process.env);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await db.auth.admin.createUser({
  email: env.PORTFOLIO_ADMIN_EMAIL,
  password: env.PORTFOLIO_ADMIN_PASSWORD,
  email_confirm: true,
});
if (error || !data.user)
  throw new Error(
    "Admin creation failed. Verify the project and whether the account already exists.",
  );
const { error: membershipError } = await db
  .from("admin_members")
  .insert({ user_id: data.user.id });
if (membershipError) {
  const rollback = await db.auth.admin.deleteUser(data.user.id);
  throw new Error(
    rollback.error
      ? "Membership failed; remove the newly created account in Supabase before retrying."
      : "Membership failed; the newly created account was removed.",
  );
}
console.info(
  "Admin provisioned. Sign in with the operator-supplied password and enroll TOTP. Remove the provisioning password from the external env file after handoff.",
);
