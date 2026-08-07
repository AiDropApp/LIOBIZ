import type { AuthSession, UserRole } from "@/lib/auth-session";

export const AUTH_COOKIE = "liobiz_auth";

function authSecret(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

function asSession(data: unknown): AuthSession | null {
  if (!data || typeof data !== "object") return null;
  const s = data as AuthSession;
  if (!s.userId || !s.email || !s.role) return null;
  if (s.role !== "admin" && s.role !== "client") return null;
  return {
    userId: Number(s.userId),
    email: String(s.email),
    name: String(s.name || ""),
    role: s.role as UserRole,
  };
}

function decodeCandidates(raw: string): string[] {
  const out: string[] = [raw];
  try {
    const once = decodeURIComponent(raw);
    if (once !== raw) out.push(once);
  } catch {
    /* ignore */
  }
  return out;
}

function parseUnsigned(raw: string): AuthSession | null {
  for (const candidate of decodeCandidates(raw)) {
    try {
      const session = asSession(JSON.parse(candidate));
      if (session) return session;
    } catch {
      /* try next */
    }
  }
  return null;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (const b of view) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function allowLegacyUnsignedCookies(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function verifySigned(raw: string): Promise<AuthSession | null> {
  const secret = authSecret();
  if (!secret) return allowLegacyUnsignedCookies() ? parseUnsigned(raw) : null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const bodyB64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  let payload: string;
  try {
    payload = new TextDecoder().decode(
      Uint8Array.from(atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
    );
  } catch {
    return null;
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expected = toBase64Url(signed);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    return asSession(JSON.parse(payload));
  } catch {
    return null;
  }
}

export async function parseAuthCookieEdge(value?: string | null): Promise<AuthSession | null> {
  if (!value) return null;
  try {
    let raw = value;
    if (value.includes(`${AUTH_COOKIE}=`) || value.includes(";")) {
      const match = value.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]*)`));
      raw = match?.[1] ? match[1] : "";
    }
    if (!raw) return null;
    return (
      (await verifySigned(raw)) ??
      (!authSecret() && allowLegacyUnsignedCookies() ? parseUnsigned(raw) : null)
    );
  } catch {
    return null;
  }
}
