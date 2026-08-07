import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3010";
const PAGES = [
  "/",
  "/about",
  "/process",
  "/portfolio",
  "/blog",
  "/contact",
  "/services/branding",
  "/login",
  "/register",
  "/site-map",
];

const browser = await chromium.launch();
let hadIssue = false;

for (const path of PAGES) {
  const page = await browser.newPage();
  const cspViolations = [];
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText || "";
    if (/CSP|Content Security Policy/i.test(failure)) {
      cspViolations.push(`${req.url()} -> ${failure}`);
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });

  const url = BASE + path;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 }).catch((e) => {
    consoleErrors.push(`navigation failed: ${e.message}`);
    return null;
  });

  await page.waitForTimeout(500);

  const cspErrors = consoleErrors.filter((m) => /content security policy|refused to/i.test(m));
  const otherErrors = consoleErrors.filter((m) => !/content security policy|refused to/i.test(m));

  console.log(`\n=== ${path} (status ${res?.status?.() ?? "N/A"}) ===`);
  if (cspErrors.length) {
    hadIssue = true;
    console.log("  CSP VIOLATIONS:");
    cspErrors.forEach((m) => console.log("   - " + m));
  } else {
    console.log("  CSP: OK (no violations)");
  }
  if (cspViolations.length) {
    hadIssue = true;
    console.log("  BLOCKED REQUESTS:");
    cspViolations.forEach((m) => console.log("   - " + m));
  }
  if (otherErrors.length) {
    console.log("  other console errors:");
    otherErrors.forEach((m) => console.log("   - " + m));
  }

  await page.close();
}

await browser.close();
console.log(hadIssue ? "\nRESULT: CSP ISSUES FOUND" : "\nRESULT: ALL CLEAR");
process.exit(hadIssue ? 1 : 0);
