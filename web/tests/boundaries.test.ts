import { describe, it, expect, afterEach } from "vitest";
import {
  contactSchema,
  contentSchema,
  testimonialSchema,
} from "../src/lib/models";
import { readSubmission, rateKey } from "../src/lib/submission";
import { demoContent } from "../src/lib/demo-content";
import { mapContent } from "../src/lib/database-map";
const valid = {
  name: "A visitor",
  email: "visitor@example.com",
  subject: "A project",
  message: "A useful introduction to a project.",
  consent: true,
  locale: "en",
  website: "",
  submissionId: "33333333-3333-4333-8333-333333333333",
};
afterEach(() => {
  delete process.env.RATE_LIMIT_SECRET;
  delete process.env.SITE_URL;
});
describe("public input boundaries", () => {
  it("requires explicit consent and rejects malformed or oversized input", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
    for (const changes of [
      { consent: false },
      { email: "not-an-email" },
      { message: "short" },
      { message: "x".repeat(5001) },
      { locale: "zz" },
      { submissionId: "bad" },
    ])
      expect(contactSchema.safeParse({ ...valid, ...changes }).success).toBe(
        false,
      );
    expect(
      testimonialSchema.safeParse({
        ...valid,
        message: "An honest description of working together.",
      }).success,
    ).toBe(true);
  });
  it("rejects cross-origin and oversized streaming requests", async () => {
    process.env.SITE_URL = "https://portfolio.example.com";
    await expect(
      readSubmission(
        new Request("https://portfolio.example.com/api/contact", {
          method: "POST",
          headers: {
            origin: "https://attacker.example",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      readSubmission(
        new Request("https://portfolio.example.com/api/contact", {
          method: "POST",
          headers: {
            origin: "https://portfolio.example.com",
            "content-type": "application/json",
          },
          body: "x".repeat(17000),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("never stores raw addresses in rate-limit keys", () => {
    process.env.RATE_LIMIT_SECRET = "x".repeat(64);
    const r = new Request("http://localhost", {
      headers: { "x-portfolio-client-ip": "192.0.2.1" },
    });
    expect(rateKey(r, "contact")).toMatch(/^[a-f0-9]{64}$/);
    expect(rateKey(r, "contact")).not.toBe(rateKey(r, "testimonial"));
  });
});
describe("publishing boundaries", () => {
  it("rejects executable URL schemes and translation-only publishing", () => {
    expect(contentSchema.safeParse(demoContent[0]).success).toBe(true);
    expect(
      contentSchema.safeParse({
        ...demoContent[0],
        source_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    const item = structuredClone(demoContent[0]);
    item.translations.en.published = false;
    expect(contentSchema.safeParse(item).success).toBe(false);
  });
  it("does not manufacture published translations missing from public results", () => {
    const { translations, ...record } = demoContent[0];
    const mapped = mapContent({
      ...record,
      content_translations: [{ ...translations.en, locale: "en" }],
    });
    expect(mapped.translations.en.published).toBe(true);
    expect(mapped.translations.fr.published).toBe(false);
    expect(mapped.translations.ar.published).toBe(false);
  });
});
