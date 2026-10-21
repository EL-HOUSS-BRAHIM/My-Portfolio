import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.DEPLOY_ENV === "staging"
        ? { userAgent: "*", disallow: "/" }
        : {
            userAgent: "*",
            allow: "/",
            disallow: ["/en/admin", "/fr/admin", "/ar/admin", "/api/"],
          },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
