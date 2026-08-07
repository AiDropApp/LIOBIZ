/**
 * Full platform audit: pages, APIs, auth, backup, CMS, security headers
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import path from "path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@liobiz.com";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Admin@12345";

const report = [];
const issues = [];

function parseSetCookie(headers) {
  const list =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter(Boolean);
  const jar = {};
  for (const line of list) {
    const part = String(line).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function req(urlPath, { method = "GET", body, jar, formData, redirect = "follow" } = {}) {
  const headers = {};
  if (body !== undefined && !formData) headers["Content-Type"] = "application/json";
  if (jar && Object.keys(jar).length) headers.Cookie = cookieHeader(jar);
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    redirect,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  const set = parseSetCookie(res.headers);
  if (Object.keys(set).length) Object.assign(jar || {}, set);
  return { status: res.status, json, text: text.slice(0, 500), jar, headers: res.headers };
}

function log(ok, area, msg, extra) {
  const line = `${ok ? "PASS" : "FAIL"} | [${area}] ${msg}${extra ? " | " + JSON.stringify(extra) : ""}`;
  report.push(line);
  console.log(line);
  if (!ok) issues.push({ area, msg, extra });
}

function issue(area, component, problem, fix) {
  issues.push({ area, component, problem, fix, type: "finding" });
}

async function main() {
  console.log("Full platform audit — BASE:", BASE);
  const stamp = Date.now();
  const clientEmail = `audit.${stamp}@liobiz.test`;
  const clientPass = "Test@12345";
  const clientJar = {};
  const adminJar = {};
  const anonJar = {};

  // Security headers (HTTP Observatory / securityheaders.com)
  {
    const r = await fetch(`${BASE}/`);
    const required = {
      "content-security-policy": "CSP",
      "x-frame-options": "X-Frame-Options",
      "referrer-policy": "Referrer-Policy",
      "permissions-policy": "Permissions-Policy",
      "x-content-type-options": "nosniff",
      "strict-transport-security": "HSTS",
    };
    for (const [header, label] of Object.entries(required)) {
      const value = r.headers.get(header);
      log(!!value?.trim(), "security", `${label} present`, { header, ok: !!value });
      if (!value) {
        issue("security", label, `هدر ${label} روی صفحه اصلی نیست`, "next.config.ts + middleware — بعد deploy دوباره اسکن کنید");
      }
    }
    const poweredBy = r.headers.get("x-powered-by");
    log(!poweredBy, "security", "X-Powered-By absent", { value: poweredBy || null });
    if (poweredBy) {
      issue("security", "X-Powered-By", "هدر X-Powered-By لو می‌رود", "poweredByHeader: false در next.config.ts");
    }
  }

  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET?.trim()) {
    issue(
      "auth",
      "AUTH_SECRET",
      "در production بدون AUTH_SECRET کوکی session امضا نمی‌شود و APIها 401 می‌دهند",
      "AUTH_SECRET را در env سرور تنظیم کنید یا audit را روی dev (pnpm dev) اجرا کنید",
    );
  }

  const publicPages = [
    "/",
    "/about",
    "/contact",
    "/blog",
    "/portfolio",
    "/process",
    "/login",
    "/register",
    "/services/web",
    "/services/branding",
    "/services/social",
    "/services/ads",
  ];

  for (const p of publicPages) {
    const r = await req(p);
    log(r.status === 200, "pages", `GET ${p}`, { status: r.status });
    if (r.status >= 500) {
      issue("pages", p, `HTTP ${r.status}`, "بررسی build و لاگ سرور");
    }
  }

  // Register + login client
  {
    const r = await req("/api/auth/register", {
      method: "POST",
      jar: clientJar,
      body: { name: "تست", email: clientEmail, password: clientPass, phone: "09121111111" },
    });
    log(r.status === 200 || r.status === 201, "auth", "POST register", { status: r.status });
  }
  if (!clientJar.liobiz_auth) {
    const r = await req("/api/auth/login", {
      method: "POST",
      jar: clientJar,
      body: { email: clientEmail, password: clientPass },
    });
    log(r.status === 200, "auth", "POST login client", { status: r.status });
  }

  {
    const r = await req("/api/auth/me", { jar: clientJar });
    log(r.status === 200 && r.json?.user?.role === "client", "auth", "GET me client", {
      status: r.status,
      role: r.json?.user?.role,
    });
  }

  // Unauthorized
  {
    const r = await req("/api/orders", { method: "POST", body: { title: "x", service: "y", description: "z" } });
    log(r.status === 401, "auth", "orders without cookie -> 401", { status: r.status });
  }

  // Client order + ticket
  let orderId = null;
  let ticketId = null;
  {
    const r = await req("/api/orders", {
      method: "POST",
      jar: clientJar,
      body: {
        title: `سفارش ${stamp}`,
        service: "وب",
        description: "تست audit",
        budget: "۵ میلیون",
      },
    });
    orderId = r.json?.id;
    log(r.status === 200 && !!orderId, "orders", "POST order", { status: r.status, orderId });
  }
  {
    const r = await req("/api/tickets", {
      method: "POST",
      jar: clientJar,
      body: { subject: `تیکت ${stamp}`, message: "پیام تست" },
    });
    ticketId = r.json?.id;
    log(r.status === 200 && !!ticketId, "tickets", "POST ticket", { status: r.status, ticketId });
  }

  // Admin login
  {
    const r = await req("/api/auth/login", {
      method: "POST",
      jar: adminJar,
      body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    log(r.status === 200 && !!adminJar.liobiz_auth, "auth", "POST login admin", { status: r.status });
    if (r.status !== 200) {
      issue("auth", "admin login", "ورود ادمین ناموفق", "بررسی seed admin و ADMIN_PASSWORD در .env.local");
    }
  }

  // Admin APIs
  for (const [name, url] of [
    ["overview", "/api/admin/overview"],
    ["users", "/api/admin/users"],
    ["orders", "/api/orders"],
    ["tickets", "/api/tickets"],
    ["contact", "/api/contact"],
    ["notifications", "/api/notifications"],
    ["content", "/api/content"],
  ]) {
    const r = await req(url, { jar: adminJar });
    log(r.status === 200, "admin-api", `GET ${name}`, { status: r.status });
  }

  // Admin sees client data
  {
    const r = await req("/api/orders", { jar: adminJar });
    const found = (r.json?.orders || []).some((o) => o.id === orderId);
    log(found, "sync", "admin sees client order", { orderId, count: r.json?.orders?.length });
    if (!found) issue("admin", "تب سفارشات", "سفارش client در admin دیده نمی‌شود", "بررسی API فیلتر role");
  }
  {
    const r = await req("/api/tickets", { jar: adminJar });
    const found = (r.json?.tickets || []).some((t) => t.id === ticketId);
    log(found, "sync", "admin sees client ticket", { ticketId });
  }

  // Backup API
  {
    const r = await req("/api/admin/backup", { jar: anonJar });
    log(r.status === 401, "backup", "GET backup without auth -> 401", { status: r.status });
  }
  {
    const r = await req("/api/admin/backup", { jar: adminJar });
    log(r.status === 200 && Array.isArray(r.json?.backups), "backup", "GET list backups", {
      status: r.status,
      count: r.json?.backups?.length,
    });
  }
  let backupId = null;
  {
    const r = await req("/api/admin/backup", { method: "POST", jar: adminJar, body: {} });
    backupId = r.json?.backup?.id;
    log(r.status === 200 && !!backupId, "backup", "POST manual backup", {
      status: r.status,
      id: backupId,
      sha256: r.json?.backup?.sha256?.slice(0, 12),
    });
  }
  if (backupId) {
    await new Promise((r) => setTimeout(r, 1500));
    let previewRes = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      previewRes = await req(`/api/admin/backup/preview?id=${encodeURIComponent(backupId)}`, { jar: adminJar });
      if (previewRes.status === 200 && Array.isArray(previewRes.json?.preview?.warnings)) break;
      await new Promise((res) => setTimeout(res, 1000));
    }
    log(
      previewRes?.status === 200 && Array.isArray(previewRes?.json?.preview?.warnings),
      "backup",
      "GET preview",
      { status: previewRes?.status, warnings: previewRes?.json?.preview?.warnings?.length },
    );
    const dl = await req(`/api/admin/backup/download?id=${encodeURIComponent(backupId)}`, { jar: adminJar });
    log(dl.status === 200, "backup", "GET download", {
      status: dl.status,
      type: dl.headers.get("content-type"),
    });
  }

  // CMS + profile (PUT-only endpoints)
  {
    const r = await req("/api/content/cms", { method: "PUT", jar: adminJar, body: {} });
    log(r.status === 200, "admin-api", "PUT cms (no-op merge)", { status: r.status });
  }
  {
    const r = await req("/api/profile", { jar: clientJar });
    log(r.status === 200 && r.json?.user?.email, "profile", "GET profile", { status: r.status });
  }
  {
    const r = await req("/api/profile", {
      method: "PUT",
      jar: clientJar,
      body: { name: "کاربر تست audit", phone: "09120000000" },
    });
    log(r.status === 200, "profile", "PUT profile", { status: r.status });
  }

  // Protected routes without auth -> redirect to login
  {
    const r = await req("/dashboard", { redirect: "manual" });
    log(r.status === 307 || r.status === 302 || r.status === 308, "auth", "GET /dashboard without cookie -> redirect", {
      status: r.status,
    });
  }
  {
    const r = await req("/admin", { redirect: "manual" });
    log(r.status === 307 || r.status === 302 || r.status === 308, "auth", "GET /admin without cookie -> redirect", {
      status: r.status,
    });
  }

  // Dashboard pages (must not redirect when authenticated)
  for (const [p, jar, role] of [
    ["/dashboard", clientJar, "client"],
    ["/admin", adminJar, "admin"],
  ]) {
    const r = await req(p, { jar, redirect: "manual" });
    log(r.status === 200, "pages", `GET ${p} (${role}, auth)`, { status: r.status });
    if (r.status >= 300 && r.status < 400) {
      issue("auth", p, "با کوکی معتبر به login ریدایرکت می‌شود", "بررسی AUTH_SECRET و امضای کوکی");
    }
  }

  // Known UX / infra findings (static audit)
  const staticFindings = [
    {
      area: "deploy",
      component: "production VPS",
      problem: "سرور origin خالی — خطای 522 Cloudflare",
      fix: "fresh-server-setup.sh + deploy-to-liobiz.ps1 از Console/VPN",
    },
    {
      area: "infra",
      component: "پورت 3000",
      problem: "اگر process دیگری روی 3000 باشد dev/audit خطا می‌دهد",
      fix: "PORT=3001 pnpm dev و BASE_URL=http://127.0.0.1:3001",
    },
  ];
  for (const f of staticFindings) issue(f.area, f.component, f.problem, f.fix);

  const pass = report.filter((l) => l.startsWith("PASS")).length;
  const fail = report.filter((l) => l.startsWith("FAIL")).length;

  const md = buildMarkdownReport(report, issues, pass, fail);
  mkdirSync("docs", { recursive: true });
  writeFileSync("docs/QA-AUDIT-REPORT.md", md);
  writeFileSync("docs/full-platform-audit.txt", report.join("\n") + `\n\nSummary: ${pass} pass, ${fail} fail\n`);

  console.log(`\nSummary: ${pass} pass, ${fail} fail`);
  console.log("Report: docs/QA-AUDIT-REPORT.md");
  process.exit(fail ? 1 : 0);
}

function buildMarkdownReport(lines, issueList, pass, fail) {
  const findings = issueList.filter((i) => i.type === "finding");
  const failures = issueList.filter((i) => !i.type);

  let md = `# گزارش ممیزی QA — Liobiz\n\n`;
  md += `تاریخ: ${new Date().toISOString()}\n\n`;
  md += `## خلاصه\n\n`;
  md += `- تست API/صفحات: **${pass} موفق** / **${fail} ناموفق**\n`;
  md += `- یافته‌های ثابت: **${findings.length}**\n\n`;

  md += `## نتایج خودکار\n\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n\n`;

  if (failures.length) {
    md += `## خطاهای تست\n\n`;
    for (const f of failures) {
      md += `### ${f.area} — ${f.msg}\n`;
      if (f.extra) md += `\n\`\`\`json\n${JSON.stringify(f.extra, null, 2)}\n\`\`\`\n\n`;
    }
  }

  md += `## یافته‌ها و راه‌حل (صفحه / تب / دکمه)\n\n`;
  md += `| بخش | جزء | مشکل | راه‌حل |\n|-----|-----|------|--------|\n`;
  for (const f of findings) {
    md += `| ${f.area} | ${f.component} | ${f.problem} | ${f.fix} |\n`;
  }

  md += `\n## پوشش تست\n\n`;
  md += `| لایه | ابزار | مسیر |\n|------|--------|------|\n`;
  md += `| Unit (backup) | Vitest | \`tests/backup.test.ts\` |\n`;
  md += `| API audit | Node script | \`scripts/full-platform-audit.mjs\` |\n`;
  md += `| E2E | Playwright | \`tests/e2e/admin.spec.ts\` |\n\n`;

  md += `## دستور اجرا\n\n`;
  md += `\`\`\`bash\npnpm test\npnpm audit:full   # سرور dev باید روشن باشد\npnpm test:e2e\n\`\`\`\n`;

  return md;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
