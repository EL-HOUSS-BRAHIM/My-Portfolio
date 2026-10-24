/* global localStorage, document, innerWidth, console */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Read-only audit: no form submissions, account access, or database writes.
const baseURL = process.env.AUDIT_URL || "http://localhost:3000";
const output = resolve(process.env.AUDIT_OUTPUT || "artifacts/audits/public");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  ...(process.env.AUDIT_PROXY
    ? { proxy: { server: process.env.AUDIT_PROXY } }
    : {}),
});
const results = [];
const routes = [
  "",
  "/work",
  "/about",
  "/services",
  "/journal",
  "/contact",
  "/privacy",
  "/testimonials",
];
try {
  for (const width of (process.env.AUDIT_WIDTHS || "320,768,1440")
    .split(",")
    .map(Number)) {
    for (const theme of (process.env.AUDIT_THEMES || "light,dark").split(",")) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: theme,
      });
      await context.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme,
      );
      const page = await context.newPage();
      for (const locale of ["en", "fr", "ar"]) {
        for (const route of routes) {
          const path = `/${locale}${route}`;
          const errors = [];
          const onError = (error) => errors.push(error.message);
          page.on("pageerror", onError);
          try {
            const response = await page.goto(baseURL + path, {
              waitUntil: "networkidle",
              timeout: 45000,
            });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(async () => {
              const images = [...document.images];
              for (const img of images) img.loading = "eager";
              await Promise.all(
                images.map((img) => img.decode().catch(() => {})),
              );
            });
            const layout = await page.evaluate(() => ({
              overflow: document.documentElement.scrollWidth > innerWidth,
              overflowing: [
                ...document.querySelectorAll("main *, header *, footer *"),
              ]
                .filter((el) => {
                  const r = el.getBoundingClientRect();
                  return (
                    r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)
                  );
                })
                .slice(0, 8)
                .map((el) => ({ tag: el.tagName, class: el.className })),
              h1: document.querySelectorAll("h1").length,
              brokenImages: [...document.images]
                .filter((img) => !img.complete || !img.naturalWidth)
                .map((img) => img.getAttribute("src")),
              smallTargets: [...document.querySelectorAll("a, button, select")]
                .filter((el) => {
                  const r = el.getBoundingClientRect();
                  return (
                    r.width > 0 &&
                    r.height > 0 &&
                    (r.height < 24 || r.width < 24)
                  );
                })
                .map((el) => ({
                  text: el.textContent.trim().slice(0, 60),
                  class: el.className,
                })),
              canonical: document.querySelector('link[rel="canonical"]')?.href,
              description: document.querySelector('meta[name="description"]')
                ?.content,
              title: document.title,
            }));
            const axe = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .analyze();
            const violations = axe.violations.map(({ id, impact, nodes }) => ({
              id,
              impact,
              nodes: nodes.map(({ target, failureSummary }) => ({
                target,
                failureSummary,
              })),
            }));
            const row = {
              path,
              width,
              theme,
              status: response.status(),
              ...layout,
              errors,
              violations,
            };
            results.push(row);
            if (!route) {
              await page.screenshot({
                path: resolve(output, `${locale}-${width}-${theme}.png`),
                fullPage: true,
              });
            }
            console.log(
              JSON.stringify({
                path,
                width,
                theme,
                status: row.status,
                overflow: row.overflow,
                violations: violations.length,
                errors: errors.length,
              }),
            );
          } catch (error) {
            results.push({ path, width, theme, error: error.message });
            console.log(
              JSON.stringify({ path, width, theme, error: error.message }),
            );
          } finally {
            page.off("pageerror", onError);
          }
          await writeFile(
            resolve(output, "results.json"),
            JSON.stringify({ baseURL, results }, null, 2),
          );
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const failures = results.filter(
  (r) =>
    r.error ||
    r.status !== 200 ||
    r.overflow ||
    r.h1 !== 1 ||
    r.brokenImages.length ||
    r.errors.length ||
    r.violations.length ||
    !r.canonical ||
    !r.description,
);
console.log(
  JSON.stringify({ total: results.length, failures: failures.length, output }),
);
process.exitCode = failures.length ? 1 : 0;
