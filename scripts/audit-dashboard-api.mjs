/**
 * Functional audit: auth + orders + tickets sync (client <-> admin)
 */
import { writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";

function parseSetCookie(headers) {
  // Node fetch: getSetCookie() if available
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

async function req(path, { method = "GET", body, jar } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (jar && Object.keys(jar).length) headers.Cookie = cookieHeader(jar);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html or empty */
  }
  const set = parseSetCookie(res.headers);
  if (Object.keys(set).length) Object.assign(jar || {}, set);
  return { status: res.status, json, text: text.slice(0, 300), jar };
}

const report = [];
function log(ok, msg, extra) {
  const line = `${ok ? "PASS" : "FAIL"} | ${msg}${extra ? " | " + JSON.stringify(extra) : ""}`;
  report.push(line);
  console.log(line);
}

async function main() {
  console.log("BASE", BASE);
  const stamp = Date.now();
  const clientEmail = `audit.client.${stamp}@liobiz.test`;
  const clientPass = "Test@12345";
  const clientJar = {};
  const adminJar = {};

  // Health
  {
    const r = await req("/");
    log(r.status === 200, "GET / home", { status: r.status });
  }

  // Register client
  {
    const r = await req("/api/auth/register", {
      method: "POST",
      jar: clientJar,
      body: {
        name: "کاربر تست",
        email: clientEmail,
        password: clientPass,
        phone: "09120000000",
        company: "تست",
      },
    });
    log(r.status === 200 || r.status === 201, "POST register client", {
      status: r.status,
      json: r.json,
      cookie: !!clientJar.liobiz_auth,
    });
  }

  // If register didn't set cookie, login
  if (!clientJar.liobiz_auth) {
    const r = await req("/api/auth/login", {
      method: "POST",
      jar: clientJar,
      body: { email: clientEmail, password: clientPass },
    });
    log(r.status === 200, "POST login client", {
      status: r.status,
      json: r.json,
      cookie: !!clientJar.liobiz_auth,
    });
  }

  // me
  {
    const r = await req("/api/auth/me", { jar: clientJar });
    log(r.status === 200 && r.json?.user?.role === "client", "GET /api/auth/me client", {
      status: r.status,
      role: r.json?.user?.role,
      id: r.json?.user?.id,
    });
  }

  // Create order
  let orderId = null;
  {
    const r = await req("/api/orders", {
      method: "POST",
      jar: clientJar,
      body: {
        title: `سفارش تست ${stamp}`,
        service: "برندینگ",
        description: "توضیحات تست سفارش برای ممیزی داشبورد",
        budget: "۱۰ میلیون",
      },
    });
    orderId = r.json?.id;
    log(r.status === 200 && !!orderId, "POST /api/orders", {
      status: r.status,
      json: r.json,
      text: r.text,
    });
  }

  // List orders as client
  {
    const r = await req("/api/orders", { jar: clientJar });
    const found = (r.json?.orders || []).some((o) => o.id === orderId);
    log(r.status === 200 && found, "GET /api/orders as client sees new order", {
      status: r.status,
      count: r.json?.orders?.length,
      found,
    });
  }

  // Create ticket
  let ticketId = null;
  {
    const r = await req("/api/tickets", {
      method: "POST",
      jar: clientJar,
      body: {
        subject: `تیکت تست ${stamp}`,
        message: "سلام، این یک تیکت تست است.",
      },
    });
    ticketId = r.json?.id;
    log(r.status === 200 && !!ticketId, "POST /api/tickets", {
      status: r.status,
      json: r.json,
      text: r.text,
    });
  }

  // List tickets as client
  {
    const r = await req("/api/tickets", { jar: clientJar });
    const found = (r.json?.tickets || []).some((t) => t.id === ticketId);
    log(r.status === 200 && found, "GET /api/tickets as client sees new ticket", {
      status: r.status,
      count: r.json?.tickets?.length,
      found,
      msgs: r.json?.tickets?.find((t) => t.id === ticketId)?.messages?.length,
    });
  }

  // Admin login
  {
    const r = await req("/api/auth/login", {
      method: "POST",
      jar: adminJar,
      body: { email: "admin@liobiz.com", password: "Admin@12345" },
    });
    log(r.status === 200 && !!adminJar.liobiz_auth, "POST login admin", {
      status: r.status,
      json: r.json,
      cookie: !!adminJar.liobiz_auth,
    });
  }

  // Admin sees order
  {
    const r = await req("/api/orders", { jar: adminJar });
    const found = (r.json?.orders || []).some((o) => o.id === orderId);
    log(r.status === 200 && found, "GET /api/orders as admin sees client order", {
      status: r.status,
      count: r.json?.orders?.length,
      found,
    });
  }

  // Admin sees ticket
  {
    const r = await req("/api/tickets", { jar: adminJar });
    const found = (r.json?.tickets || []).some((t) => t.id === ticketId);
    log(r.status === 200 && found, "GET /api/tickets as admin sees client ticket", {
      status: r.status,
      count: r.json?.tickets?.length,
      found,
    });
  }

  // Admin overview
  {
    const r = await req("/api/admin/overview", { jar: adminJar });
    log(r.status === 200, "GET /api/admin/overview", {
      status: r.status,
      stats: r.json?.stats,
    });
  }

  // Admin users
  {
    const r = await req("/api/admin/users", { jar: adminJar });
    log(r.status === 200 && Array.isArray(r.json?.users), "GET /api/admin/users", {
      status: r.status,
      count: r.json?.users?.length,
    });
  }

  // Contact messages
  {
    const r = await req("/api/contact", { jar: adminJar });
    log(r.status === 200, "GET /api/contact as admin", {
      status: r.status,
      count: r.json?.messages?.length,
    });
  }

  // Client without cookie should 401
  {
    const r = await req("/api/orders", { method: "POST", body: { title: "x", service: "y", description: "z" } });
    log(r.status === 401, "POST /api/orders without auth -> 401", { status: r.status });
  }

  // Pages
  for (const p of ["/dashboard", "/admin", "/login", "/register"]) {
    const r = await req(p, { jar: p === "/admin" ? adminJar : clientJar });
    log(r.status === 200 || r.status === 307 || r.status === 302, `PAGE ${p}`, { status: r.status });
  }

  const fail = report.filter((l) => l.startsWith("FAIL")).length;
  const pass = report.filter((l) => l.startsWith("PASS")).length;
  console.log(`\nSummary: ${pass} pass, ${fail} fail`);
  writeFileSync("docs/dashboard-api-audit.txt", report.join("\n") + `\n\nSummary: ${pass} pass, ${fail} fail\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
