/* global Storage, DOMException, console */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.AUDIT_URL || "http://localhost:3000";
const output = resolve(
  process.env.AUDIT_OUTPUT || "artifacts/audits/interactions",
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 768, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/en/work?category=systems`);
  await expect(page.locator(".project-card")).toHaveCount(2);
  for (const [name, locale] of [
    ["Français", "fr"],
    ["العربية", "ar"],
    ["English", "en"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr",
    );
    await expect(page.locator(".project-card")).toHaveCount(2);
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/work\\?category=systems$`),
    );
  }
  checks.push("Language, RTL, URL and filter survive en → fr → ar → en");
  await page.goto(`${baseURL}/en/work?category=mobile`);
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".project-card h3")).toContainText("Lyvora");
  checks.push("Mobile filter returns Lyvora");
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(`${baseURL}/en`);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByLabel("Color theme")
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("dialog").getByLabel("Color theme"),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toBeFocused();
  checks.push(
    "Keyboard skip link, short-screen dialog scrolling, Escape and focus restoration",
  );

  if (process.env.AUDIT_FORMS === "mock") {
    // All submissions are intercepted locally. Nothing is sent to the production API.
    for (const [path, endpoint, button, success] of [
      [
        "contact",
        "/api/contact",
        "Send message",
        "Your message is safely received",
      ],
      [
        "testimonials",
        "/api/testimonials",
        "Submit feedback",
        "will be reviewed before publication",
      ],
    ]) {
      const payloads = [];
      await page.route(`**${endpoint}`, async (route) => {
        payloads.push(route.request().postDataJSON());
        if (payloads.length === 2)
          await route.fulfill({
            status: 429,
            contentType: "application/json",
            body: '{"ok":false,"code":"limited"}',
          });
        else if (payloads.length < 4) await route.abort("connectionfailed");
        else
          await route.fulfill({
            status: 202,
            contentType: "application/json",
            body: '{"ok":true}',
          });
      });
      await page.goto(`${baseURL}/en/${path}`);
      await page.locator('input[name="name"]').fill("Browser audit");
      if (path === "contact")
        await page.locator('input[name="email"]').fill("audit@example.invalid");
      const message = page.locator('textarea[name="message"]');
      await message.fill(
        "A mocked browser audit message. Never sent to the server.",
      );
      await page.locator('input[name="consent"]').check();
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.getByRole("button", { name: button, exact: true }).click();
        await expect(page.getByRole("status")).toContainText(
          attempt === 1 ? "Too many messages" : "couldn’t confirm receipt",
        );
        await expect(message).not.toHaveValue("");
      }
      expect(payloads[0].submissionId).toBe(payloads[1].submissionId);
      expect(payloads[0].submissionId).toBe(payloads[2].submissionId);
      await message.fill(
        "An edited mocked audit message, also never sent to the server.",
      );
      await page.getByRole("button", { name: button, exact: true }).click();
      await expect(page.getByRole("status")).toContainText(success);
      await expect(message).toHaveValue("");
      expect(payloads[3].submissionId).not.toBe(payloads[2].submissionId);
      await page.unroute(`**${endpoint}`);
      checks.push(
        `${path}: mocked failed retries retain identity/text, edits rotate identity, success resets form`,
      );
    }
  }
  const restricted = await browser.newContext({ colorScheme: "dark" });
  await restricted.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  const restrictedPage = await restricted.newPage();
  restrictedPage.on("pageerror", (error) => errors.push(error.message));
  await restrictedPage.goto(`${baseURL}/en`);
  await expect(restrictedPage.locator("html")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await restrictedPage.getByLabel("Color theme").selectOption("light");
  await expect(restrictedPage.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );
  expect(errors).toEqual([]);
  checks.push(
    "Restricted storage preserves theme control with no browser exceptions",
  );
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify({ baseURL, checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser.close();
}
