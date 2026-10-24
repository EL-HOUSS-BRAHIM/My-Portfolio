import { expect, test } from "@playwright/test";

test("without JavaScript mobile navigation works and forms cannot leak values into a URL", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 812 },
  });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3000/en");
    await expect(page.locator(".no-script-nav")).toBeVisible();
    await page
      .locator(".no-script-nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/about$/);
    for (const path of ["contact", "testimonials"]) {
      await page.goto(`http://localhost:3000/en/${path}`);
      await expect(page.locator("form")).toHaveAttribute("method", "post");
      await expect(page.locator('form input[name="name"]')).toBeDisabled();
      await expect(page.locator("form button")).toBeDisabled();
      await expect(page.locator("main noscript p")).toBeVisible();
      expect(await page.locator("main").innerText()).toContain(
        "Enable JavaScript",
      );
    }
  } finally {
    await context.close();
  }
});

test("tablet hero, enlarged text, and navigation stay inside the viewport", async ({
  page,
}) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["en", "fr", "ar"]) {
      await page.goto(`/${locale}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.locator(".mobile-menu")).toBeVisible({
        visible: width <= 1000,
      });
    }
  }
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/fr/contact");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("filters survive reload and language changes and mobile work has its own category", async ({
  page,
}) => {
  await page.goto("/en/work?category=systems");
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("link", { name: "Français", exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/work\?category=systems$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".desktop-nav a").first()).toHaveAttribute(
    "href",
    "/fr/work",
  );
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Applications mobiles", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".project-card h3")).toContainText("Lyvora");
  await expect(page.locator(".filter-count")).toContainText("1 projet");
  await page.getByRole("link", { name: "العربية", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".desktop-nav a").first()).toHaveAttribute(
    "href",
    "/ar/work",
  );
  await page.goto("/en/work");
  await expect(page.locator(".image-number").last()).toHaveText("10");
});

test("theme works when browser storage is denied and tracks system changes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Color theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Color theme").selectOption("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("footer controls have comfortable targets and privacy has its own metadata", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/fr/privacy");
  await expect(page).toHaveTitle(/confidentialité|vie privée|données/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/fr\/privacy$/,
  );
  for (const control of await page.locator("footer a, footer select").all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/en");
  expect((await page.title()).match(/Brahim El Houss/g)).toHaveLength(1);
});
