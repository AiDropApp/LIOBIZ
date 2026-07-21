import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@liobiz.com";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Admin@12345";

async function blockPwaPrompt(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("liobiz-pwa-install-dismissed", "1");
    localStorage.setItem("liobiz-pwa-installed", "1");
  });
}

async function loginViaApi(page: Page, email: string, password: string) {
  const res = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

test.describe("Admin panel", () => {
  test.beforeEach(async ({ page }) => {
    await blockPwaPrompt(page);
    await loginViaApi(page, ADMIN_EMAIL, ADMIN_PASS);
  });

  test("loads overview tab", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.getByTestId("dash-nav-overview")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/کاربر|سفارش|تیکت|پیام/i).first()).toBeVisible();
  });

  test("backup tab creates backup row", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.getByTestId("dash-nav-backup")).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/admin/backup") && res.request().method() === "GET",
      ),
      page.getByTestId("dash-nav-backup").click(),
    ]);

    await expect(page.getByTestId("admin-backup-panel")).toBeVisible();

    const createRes = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/admin/backup") && res.request().method() === "POST",
      ),
      page.getByRole("button", { name: "بک‌آپ دستی" }).click(),
    ]).then(([res]) => res);
    const created = await createRes.json();
    expect(created.ok).toBe(true);
    expect(created.backup?.filename).toMatch(/manual\.zip$/);

    await page.waitForResponse(
      (res) => res.url().includes("/api/admin/backup") && res.request().method() === "GET",
      { timeout: 60_000 },
    );
    await expect(page.locator(".admin-table tbody tr").first()).toBeVisible({ timeout: 60_000 });
  });

  test("public pages render", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of ["/", "/about", "/contact", "/blog", "/portfolio", "/process"]) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});

test.describe("Auth flows", () => {
  test.beforeEach(async ({ page }) => {
    await blockPwaPrompt(page);
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("dashboard requires auth", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("UI login redirects admin", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("ایمیل").fill(ADMIN_EMAIL);
    await page.getByLabel("رمز عبور").fill(ADMIN_PASS);
    await Promise.all([
      page.waitForURL(/\/admin/, { timeout: 25_000 }),
      page.waitForResponse((res) => res.url().includes("/api/auth/login") && res.ok()),
      page.getByRole("button", { name: "ورود", exact: true }).click(),
    ]);
  });
});
