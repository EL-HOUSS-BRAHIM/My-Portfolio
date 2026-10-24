import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { demoContent } from "../src/lib/demo-content";
import { contentSchema } from "../src/lib/models";

describe("publishable editorial collection", () => {
  it("validates every translation and local image", () => {
    const slugs = new Set<string>();
    for (const item of demoContent) {
      expect(contentSchema.safeParse(item).success, item.slug).toBe(true);
      const key = `${item.kind}/${item.slug}`;
      expect(slugs.has(key), key).toBe(false);
      slugs.add(key);
      if (item.image)
        expect(existsSync(resolve("public", item.image.slice(1)))).toBe(true);
      for (const text of Object.values(item.translations)) {
        expect(text.published).toBe(true);
        expect(text.summary.length).toBeGreaterThan(15);
      }
    }
  });
  it("keeps reports sourced and milestones separate from employment", () => {
    const reports = demoContent.filter(
      (c) => c.kind === "post" && c.source_url !== "",
    );
    expect(reports.length).toBe(3);
    for (const report of reports)
      for (const text of Object.values(report.translations)) {
        expect(text.body).toContain("https://github.com/EL-HOUSS-BRAHIM");
      }
    expect(demoContent.filter((c) => c.kind === "testimonial")).toEqual([]);
    expect(
      demoContent.filter((c) => c.kind === "experience").map((c) => c.category),
    ).toEqual(["2023", "2024", "2025", "2026"]);
  });
  it("uses standalone conceptual SVG covers", () => {
    for (const name of [
      "watch-party",
      "publishing",
      "travel",
      "portfolio",
      "journey",
    ]) {
      const svg = readFileSync(`public/images/${name}-cover.svg`, "utf8");
      expect(svg).toContain('viewBox="0 0 1200 600"');
      expect(svg).not.toMatch(/<script|<foreignObject|href=|onload=/i);
    }
  });
});
