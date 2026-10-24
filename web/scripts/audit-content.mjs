/* global document, innerWidth, DOMParser, fetch, console, URL */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.AUDIT_URL || "http://localhost:3000";
const output = resolve(process.env.AUDIT_OUTPUT || "artifacts/audits/content");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 320, height: 900 },
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/en`);
  const paths = await page.evaluate(async () => {
    const xml = await (await fetch("/sitemap.xml")).text();
    return [
      ...new DOMParser()
        .parseFromString(xml, "application/xml")
        .querySelectorAll("loc"),
    ]
      .map((el) => new URL(el.textContent).pathname)
      .filter((path) => /^\/(en|fr|ar)\/(work|journal)\/.+/.test(path));
  });
  if (!paths.length)
    throw new Error("No published detail routes found in sitemap");
  for (const path of paths) {
    const response = await page.goto(baseURL + path, {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = [...document.images];
      for (const img of images) img.loading = "eager";
      await Promise.all(images.map((img) => img.decode().catch(() => {})));
    });
    const layout = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: [...document.images]
        .filter((img) => !img.complete || !img.naturalWidth)
        .map((img) => img.getAttribute("src")),
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
      lang: document.documentElement.lang,
      direction: document.documentElement.dir,
    }));
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    results.push({
      path,
      status: response.status(),
      ...layout,
      violations: axe.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      })),
    });
    await writeFile(
      resolve(output, "results.json"),
      JSON.stringify({ baseURL, results }, null, 2),
    );
    console.log(JSON.stringify(results.at(-1)));
  }
} finally {
  await browser.close();
}
const failures = results.filter(
  (r) =>
    r.status !== 200 ||
    r.h1 !== 1 ||
    r.overflow ||
    r.brokenImages.length ||
    r.violations.length ||
    !r.canonical ||
    !r.canonical.endsWith(r.path) ||
    !r.path.startsWith(`/${r.lang}/`) ||
    r.direction !== (r.lang === "ar" ? "rtl" : "ltr"),
);
console.log(
  JSON.stringify({ total: results.length, failures: failures.length, output }),
);
process.exitCode = failures.length ? 1 : 0;
