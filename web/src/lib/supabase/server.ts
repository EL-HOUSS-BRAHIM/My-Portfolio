import "server-only";
import type { Database } from "@/lib/database.types";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicConfig, secretConfig } from "@/lib/env";
export async function sessionClient() {
  const config = publicConfig();
  const jar = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values) {
            jar.set(name, value, {
              ...options,
              sameSite: "lax",
              secure:
                process.env.DEPLOY_ENV === "production" ||
                process.env.DEPLOY_ENV === "staging",
            });
          }
        } catch {
          /* Server Components cannot set cookies; the proxy refreshes sessions. */
        }
      },
    },
  });
}
export function publicClient() {
  const c = publicConfig();
  return createClient<Database>(c.url, c.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function serviceClient() {
  const c = secretConfig();
  return createClient<Database>(c.url, c.secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
