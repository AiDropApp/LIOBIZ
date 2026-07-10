import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "docs", "screenshots", "ui-audit");
fs.mkdirSync(outDir, { recursive: true });

const base = process.env.BASE_URL || "http://localhost:3000";
const adminEmail = process.env.ADMIN_EMAIL || "admin@liobiz.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

const pages = [
  { name: "01-home-full", path: "/", fullPage: true },
  { name: "01-home-hero", path: "/", fullPage: false },
  { name: "02-about", path: "/about", fullPage: true },
  { name: "03-portfolio", path: "/portfolio", fullPage: true },
  { name: "04-process", path: "/process", fullPage: true },
  { name: "05-contact", path: "/contact", fullPage: true },
  { name: "06-login", path: "/login", fullPage: true },
  { name: "07-register", path: "/register", fullPage: true },
  { name: "08-service-branding", path: "/services/branding", fullPage: true },
  { name: "09-service-web", path: "/services/web", fullPage: true },
  { name: "10-service-social", path: "/services/social", fullPage: true },
  { name: "11-service-ads", path: "/services/ads", fullPage: true },
  { name: "12-service-content", path: "/services/content", fullPage: true },
];

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "fa-IR",
  deviceScaleFactor: 1,
});

const page = await context.newPage();

for (const item of pages) {
  const url = `${base}${item.path}`;
  console.log(`Capturing ${item.name} -> ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1500);
    const file = path.join(outDir, `${item.name}.png`);
    await page.screenshot({ path: file, fullPage: item.fullPage !== false });
    console.log(`Saved ${file}`);
  } catch (err) {
    console.error(`Failed ${item.name}:`, err.message);
  }
}

console.log("Logging in as admin...");
try {
  await page.goto(`${base}/login`, { waitUntil: "networkidle", timeout: 90000 });
  await page.fill('input[type="email"], input[name="email"]', adminEmail);
  await page.fill('input[type="password"], input[name="password"]', adminPassword);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle", timeout: 90000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1800);

  await page.goto(`${base}/admin`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(outDir, "20-admin-overview.png"),
    fullPage: true,
  });
  console.log("Saved admin overview");

  // Try clicking common admin tabs if present
  const tabLabels = ["کاربران", "پروژه‌ها", "محتوا", "پیام‌ها", "CMS"];
  for (const label of tabLabels) {
    const tab = page.getByRole("button", { name: label }).first();
    if (await tab.count()) {
      await tab.click().catch(() => null);
      await page.waitForTimeout(900);
      const slug = label.replace(/\s+/g, "-");
      await page.screenshot({
        path: path.join(outDir, `21-admin-${slug}.png`),
        fullPage: true,
      });
      console.log(`Saved admin tab ${label}`);
    }
  }

  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(outDir, "30-dashboard.png"),
    fullPage: true,
  });
  console.log("Saved dashboard");
} catch (err) {
  console.error("Auth/dashboard capture failed:", err.message);
}

await browser.close();
console.log(`\nAll screenshots in: ${outDir}`);
