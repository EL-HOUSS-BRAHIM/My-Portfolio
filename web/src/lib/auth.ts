import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/server";
import { hasSupabase } from "./env";
export async function adminSession() {
  if (!hasSupabase()) return null;
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: member } = await db
    .from("admin_members")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return null;
  const { data: assurance } =
    await db.auth.mfa.getAuthenticatorAssuranceLevel();
  return { db, user, mfa: assurance?.currentLevel === "aal2" };
}
export async function requireAdmin(locale = "en") {
  const session = await adminSession();
  if (!session?.mfa) redirect(`/${locale}/admin/login`);
  return session;
}
