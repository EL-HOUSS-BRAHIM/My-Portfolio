import type { Database } from "@/lib/database.types";
import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";
const intl = createMiddleware(routing);
export async function proxy(request: NextRequest) {
  let response = intl(request);
  const admin = /\/(en|fr|ar)\/admin(?:\/|$)/.test(request.nextUrl.pathname);
  if (admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      const db = createServerClient<Database>(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            for (const { name, value } of values)
              request.cookies.set(name, value);
            // Forward refreshed cookies to the Server Component request as well as the browser.
            response = intl(request);
            for (const { name, value, options } of values)
              response.cookies.set(name, value, {
                ...options,
                secure: ["staging", "production"].includes(
                  process.env.DEPLOY_ENV || "",
                ),
              });
          },
        },
      });
      await db.auth.getUser();
    }
  }
  if (admin) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (process.env.DEPLOY_ENV === "staging")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    "/((?!api|auth|src|_next|images|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
