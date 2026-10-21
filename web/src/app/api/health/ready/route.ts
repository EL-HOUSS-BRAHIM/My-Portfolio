import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { hasSupabase } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const expected = process.env.HEALTH_TOKEN;
  const value = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (
    !expected ||
    !value ||
    Buffer.byteLength(value) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  )
    return new Response(null, { status: 404 });
  try {
    if (!hasSupabase()) throw new Error();
    z.object({
      SITE_URL: z.url(),
      RATE_LIMIT_SECRET: z.string().min(32),
      SMTP_HOST: z.string().min(1),
      SMTP_PORT: z.coerce.number().int().min(1).max(65535),
      SMTP_USER: z.string().min(1),
      SMTP_PASSWORD: z.string().min(1),
      SMTP_FROM: z.email(),
      CONTACT_TO: z.email(),
      SMTP_SECURE: z.enum(["true", "false"]),
    }).parse(process.env);
    const { error } = await serviceClient()
      .from("content")
      .select("id")
      .limit(1);
    if (error) throw error;
    return Response.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
