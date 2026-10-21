import { NextResponse } from "next/server";
import { sessionClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const db = await sessionClient();
    await db.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/en/admin/login", siteUrl()));
}
