import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

// The validation profile intentionally reads only the workspace .env at runtime.
// Values are never logged, committed, or included in screenshots/reports.
loadEnvFile(
  resolve(process.cwd(), process.env.PLAYWRIGHT_ENV_FILE || "../.env"),
);

if (!process.env.test_admin_email || !process.env.test_admin_password) {
  throw new Error(
    "Playwright requires test_admin_email and test_admin_password in the configured .env",
  );
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["json", { outputFile: "test-results/playwright.json" }]],
  use: {
    baseURL,
    // Do not persist the login screen on failure: it contains the test email.
    // The test attaches screenshots only after authentication succeeds.
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 8080",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
