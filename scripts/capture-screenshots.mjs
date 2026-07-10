import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "docs", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const base = process.env.BASE_URL || "http://localhost:3000";

const pages = [
  { name: "01-home", path: "/" },
  { name: "02-about", path: "/about" },
  { name: "03-portfolio", path: "/portfolio" },
  { name: "04-process", path: "/process" },
  { name: "05-contact", path: "/contact" },
  { name: "06-login", path: "/login" },
  { name: "07-register", path: "/register" },
  { name: "08-service-branding", path: "/services/branding" },
  { name: "09-service-web", path: "/services/web" },
  { name: "10-service-social", path: "/services/social" },
  { name: "11-service-ads", path: "/services/ads" },
];

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "fa-IR",
});

const page = await context.newPage();

for (const item of pages) {
  const url = `${base}${item.path}`;
  console.log(`Capturing ${item.name} -> ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const file = path.join(outDir, `${item.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved ${file}`);
}

// Login as admin and capture dashboards
console.log("Logging in as admin...");
await page.goto(`${base}/login`, { waitUntil: "networkidle", timeout: 60000 });
await page.fill('input[type="email"], input[name="email"]', "admin@liobiz.com");
await page.fill('input[type="password"], input[name="password"]', "Admin@12345");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle", timeout: 60000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(1500);

await page.goto(`${base}/admin`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({
  path: path.join(outDir, "12-admin.png"),
  fullPage: true,
});
console.log("Saved admin");

await page.goto(`${base}/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({
  path: path.join(outDir, "13-dashboard.png"),
  fullPage: true,
});
console.log("Saved dashboard");

// Also save a compact hero preview for GitHub README
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({
  path: path.join(outDir, "preview.png"),
  fullPage: false,
  clip: { x: 0, y: 0, width: 1440, height: 900 },
});
console.log("Saved preview.png");

await browser.close();
console.log("Done.");
