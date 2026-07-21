import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "docs/playwright-report" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:3001",
    locale: "fa-IR",
    trace: "on-first-retry",
  },
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
      },
    },
  ],
});
