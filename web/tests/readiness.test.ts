import { afterEach, beforeEach, expect, it, vi } from "vitest";
const database = vi.hoisted(() => ({ error: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({
  serviceClient: () => ({
    from: () => ({
      select: () => ({ limit: async () => ({ error: database.error }) }),
    }),
  }),
}));
import { GET } from "../src/app/api/health/ready/route";
const request = () =>
  new Request("https://portfolio.example.com/api/health/ready", {
    headers: { authorization: "Bearer test-health-token" },
  });
beforeEach(() => {
  vi.stubEnv("HEALTH_TOKEN", "test-health-token");
  vi.stubEnv("SITE_URL", "https://portfolio.example.com");
  vi.stubEnv("RATE_LIMIT_SECRET", "a".repeat(32));
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  for (const key of [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "CONTACT_TO",
  ])
    vi.stubEnv(key, "");
  database.error = null;
});
afterEach(() => vi.unstubAllEnvs());
it("is ready with database configuration and no SMTP", async () => {
  expect((await GET(request())).status).toBe(200);
});
it("still rejects missing core configuration and database failures", async () => {
  vi.stubEnv("RATE_LIMIT_SECRET", "");
  expect((await GET(request())).status).toBe(503);
  vi.stubEnv("RATE_LIMIT_SECRET", "a".repeat(32));
  database.error = new Error("offline");
  expect((await GET(request())).status).toBe(503);
});
it("keeps readiness private", async () => {
  expect(
    (await GET(new Request("https://portfolio.example.com/api/health/ready")))
      .status,
  ).toBe(404);
});
