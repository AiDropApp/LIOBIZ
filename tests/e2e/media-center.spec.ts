import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@liobiz.com";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Admin@12345";

async function blockPwaPrompt(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("liobiz-pwa-install-dismissed", "1");
    localStorage.setItem("liobiz-pwa-installed", "1");
  });
}

async function loginViaApi(page: Page) {
  const res = await page.request.post("/api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

async function openMediaCenter(page: Page) {
  await page.goto("/admin", { waitUntil: "networkidle" });

  const menuBtn = page.locator(".dash-menu-btn");
  if (await menuBtn.isVisible()) {
    const mediaNav = page.getByTestId("dash-nav-media");
    if (!(await mediaNav.isVisible())) {
      await menuBtn.click();
    }
  }

  await page.getByTestId("dash-nav-media").click();
  await expect(page.getByTestId("admin-media-center")).toBeVisible({ timeout: 20_000 });
}

test.describe("Admin media center", () => {
  test.beforeEach(async ({ page }) => {
    await blockPwaPrompt(page);
    await loginViaApi(page);
  });

  for (const section of [
    { label: "پشت صحنه", id: "backstage" },
    { label: "همکاران خلاق", id: "creative-partners" },
    { label: "نمونه کار", id: "portfolio" },
  ]) {
    test(`${section.id} library uses full-width grid layout`, async ({ page }) => {
      test.setTimeout(90_000);
      await openMediaCenter(page);
      await page.getByRole("button", { name: section.label, exact: true }).click();

      const main = page.locator(".admin-media-main");
      await expect(main).toBeVisible();

      const mainBox = await main.boundingBox();
      expect(mainBox?.width ?? 0).toBeGreaterThan(500);

      const layout = page.locator(".admin-media-layout");
      await expect(layout).not.toHaveClass(/admin-media-layout--with-sidebar/);

      await expect(page.getByTestId("admin-media-category-bar")).toBeVisible();

      const grid = page.getByTestId("admin-media-library-grid");
      if (await grid.count()) {
        const gridBox = await grid.boundingBox();
        expect(gridBox?.width ?? 0).toBeGreaterThan(400);

        const style = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
        expect(style).not.toBe("none");
      }
    });
  }

  test("library previews load without broken image icons", async ({ page }) => {
    test.setTimeout(90_000);
    await openMediaCenter(page);
    await page.getByRole("button", { name: "پشت صحنه", exact: true }).click();

    await page.waitForResponse(
      (res) => res.url().includes("/api/admin/media/entries") && res.ok(),
      { timeout: 45_000 },
    );

    const grid = page.getByTestId("admin-media-library-grid");
    if (!(await grid.isVisible({ timeout: 15_000 }).catch(() => false))) {
      test.skip(true, "No media library grid rendered (empty section or Files.ir unavailable)");
    }

    const previews = grid.locator(".admin-media-library-preview");
    const count = await previews.count();
    test.skip(count === 0, "No media files in library for preview check");

    for (let i = 0; i < Math.min(count, 6); i += 1) {
      const el = previews.nth(i);
      const tag = await el.evaluate((node) => node.tagName.toLowerCase());
      if (tag === "img") {
        await expect
          .poll(async () => el.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
            timeout: 15_000,
          })
          .toBe(true);
      } else if (tag === "video") {
        await expect(el).toHaveAttribute("src", /.+/);
      }
    }
  });

  test("media entries API accepts flat section query", async ({ page }) => {
    await loginViaApi(page);
    const res = await page.request.get("/api/admin/media/entries?flat=1&section=backstage");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test("media center is usable on mobile viewport", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openMediaCenter(page);
    await page.getByRole("button", { name: "پشت صحنه", exact: true }).click();

    await expect(page.getByTestId("admin-media-center")).toBeVisible();
    const mainBox = await page.locator(".admin-media-main").boundingBox();
    expect(mainBox?.width ?? 0).toBeGreaterThan(300);
  });
});
