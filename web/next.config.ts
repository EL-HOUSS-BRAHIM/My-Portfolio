import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/portfolio/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: true },
      ...["about", "blog", "videos", "index"].map((p) => ({
        source: `/${p}.php`,
        destination:
          p === "index"
            ? "/en"
            : p === "blog"
              ? "/en/journal"
              : p === "videos"
                ? "/en/about"
                : "/en/about",
        permanent: true,
      })),
      ...[
        "day-in-life-moroccan-developer",
        "my-journey-from-physics-to-code",
        "portfolio-deep-dive",
      ].map((slug) => ({
        source: `/blog/${slug}.php`,
        destination: `/en/journal/${slug}`,
        permanent: true,
      })),
      {
        source: "/admin/:path*",
        destination: "/en/admin/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:locale(en|fr|ar)/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          ...(process.env.DEPLOY_ENV === "staging"
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
        ],
      },
    ];
  },
};
export default createNextIntlPlugin("./src/i18n/request.ts")(config);
