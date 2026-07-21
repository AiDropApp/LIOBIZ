const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const jar = {};

function parseSetCookie(headers) {
  const list =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter(Boolean);
  for (const line of list) {
    const part = String(line).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar[part.slice(0, eq)] = part.slice(eq + 1);
  }
}

async function req(path, opts = {}) {
  const headers = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (Object.keys(jar).length) headers.Cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  parseSetCookie(res.headers);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, text, json };
}

const login = await req("/api/auth/login", {
  method: "POST",
  body: { email: "admin@liobiz.com", password: "Admin@12345" },
});
console.log("login", login.status, login.json?.user?.email);

const checks = [
  "/",
  "/admin",
  "/dashboard",
  "/api/admin/media/entries?scope=folder&includeFolders=1&parentId=2265326",
  "/api/admin/media/categories?section=portfolio",
  "/api/admin/media/cards?section=portfolio",
];

for (const path of checks) {
  const r = await req(path);
  const brief = r.json ? JSON.stringify(r.json).slice(0, 120) : r.text.slice(0, 120);
  console.log(path, r.status, brief);
}
