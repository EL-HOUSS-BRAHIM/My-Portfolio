import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "fr", "ar"]) {
  test(`${locale}: server-rendered content, navigation and accessibility`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr",
    );
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".project-card")).toHaveCount(3);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.goto(`/${locale}/work/simple-shell`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".prose")).toContainText(
      locale === "ar" ? "السؤال" : locale === "fr" ? "question" : "question",
    );
  });
}
test("filters, theme and language preserve page context", async ({ page }) => {
  await page.goto("/en/work");
  await expect(page.locator(".project-card")).toHaveCount(8);
  await page.getByRole("button", { name: "Systems", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByLabel("Color theme").selectOption("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Français", exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/work$/);
});
test("mobile navigation and RTL have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ar");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "إغلاق القائمة" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("demo contact cannot claim to save messages; admin remains private", async ({
  page,
  request,
}) => {
  await page.goto("/en/contact");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeDisabled();
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "Private dashboard" }),
  ).toBeVisible();
  const response = await request.post("/api/contact", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(response.status()).toBe(400);
});
test("contact form accessibility", async ({ page }) => {
  await page.goto("/fr/contact");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("public content remains readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/en/work/simple-shell");
  await expect(page.locator("h1")).toContainText("shell");
  await expect(page.locator(".prose")).toContainText("process");
  await context.close();
});
test("legacy redirects, sitemap and retired endpoints", async ({ request }) => {
  const response = await request.get("/about.php", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/en/about");
  expect((await request.get("/src/api/projects.php")).status()).toBe(410);
  const map = await request.get("/sitemap.xml");
  expect(map.status()).toBe(200);
  expect(await map.text()).toContain("/ar/work/simple-shell");
  expect((await request.get("/api/health/ready")).status()).toBe(404);
});

test("320px layout and dark theme remain accessible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  for (const locale of ["en", "fr", "ar"]) {
    await page.goto(`/${locale}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/en");
  await page.getByLabel("Color theme").selectOption("dark");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("authentication callback bypasses locale routing", async ({ request }) => {
  const response = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    "http://localhost:3000/en/admin/login",
  );
});

for (const locale of ["en", "fr", "ar"]) {
  test(`${locale}: milestones, illustrated reports, and project evidence`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(`/${locale}/about`);
    await expect(page.locator(".timeline li")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/${locale}/journal`);
    await expect(page.locator(".journal-item")).toHaveCount(3);
    await expect(page.locator(".journal-image img")).toHaveCount(3);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.goto(`/${locale}/journal/watch-party-architecture-report`);
    await expect(page.locator(".prose")).toContainText("Watch Party");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/${locale}/work/watch-party`);
    await expect(page.locator(".case-figure")).toBeVisible();
    if (locale === "en")
      await expect(page.locator(".prose img")).toHaveCount(1);
    await expect
      .poll(async () =>
        page
          .locator("article img")
          .evaluateAll((els) =>
            els.every(
              (el) =>
                (el as HTMLImageElement).complete &&
                (el as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
  });
}
