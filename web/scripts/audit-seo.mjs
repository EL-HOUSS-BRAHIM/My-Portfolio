/* global document, console, URL */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.AUDIT_URL || "https://brahim-elhouss.tech";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
try {
  const page = await browser.newPage();
  const response = await page.goto(base + "/sitemap.xml");
  if (!response?.ok()) throw new Error("Sitemap unavailable");
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const results = [];
  for (const url of urls) {
    const path = new URL(url).pathname;
    const res = await page.goto(base + path);
    const data = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      h1: document.querySelectorAll("h1").length,
      lang: document.documentElement.lang,
      robots: document.querySelector('meta[name="robots"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      twitter: document.querySelector('meta[name="twitter:card"]')?.content,
      alternates: [...document.querySelectorAll("link[hreflang]")].map((a) => ({
        lang: a.hreflang,
        url: a.href,
      })),
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((s) => JSON.parse(s.textContent)),
    }));
    results.push({ path, status: res.status(), ...data });
  }
  await mkdir("artifacts/audits/seo", { recursive: true });
  await writeFile(
    "artifacts/audits/seo/live.json",
    JSON.stringify(
      { base, checkedAt: new Date().toISOString(), results },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      count: results.length,
      failures: results.filter(
        (r) =>
          r.status !== 200 ||
          !r.description ||
          r.h1 !== 1 ||
          r.canonical !== base + r.path,
      ),
      missingOg: results.filter((r) => !r.ogImage).length,
      missingTwitter: results.filter((r) => !r.twitter).length,
    }),
  );
} finally {
  await browser.close();
}
