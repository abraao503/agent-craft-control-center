import { test, expect } from "@playwright/test";

const uuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

const targetPath = process.env.PLAYWRIGHT_PATH?.trim() || "/dashboard";

if (!targetPath.startsWith("/")) {
  throw new Error("PLAYWRIGHT_PATH must be an application path starting with '/'");
}

test.describe("authenticated visual shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill(process.env.test_admin_email ?? "");
    await page.locator("#password").fill(process.env.test_admin_password ?? "");

    await page
      .locator("form")
      .getByRole("button", { name: /sign in|entrar|login|iniciar/i })
      .click();
    await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/, {
      timeout: 20_000,
    });

    await page.goto(targetPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("keeps the initial viewport usable and user-facing", async ({ page }, testInfo) => {
    await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);

    if (testInfo.project.name === "chromium-mobile") {
      await expect(page.locator('[data-sidebar="mobile-overlay"]')).toHaveCount(0);
    }

    const viewportMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(
      viewportMetrics.clientWidth + 1,
    );

    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(uuidPattern);

    const screenshotPath = testInfo.outputPath("viewport.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await testInfo.attach("viewport", {
      path: screenshotPath,
      contentType: "image/png",
    });
  });
});
