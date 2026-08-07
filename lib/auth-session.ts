import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "liobiz_auth";

export type UserRole = "admin" | "client";

export type AuthSession = {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
};

function authSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret || null;
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
    role: s.role,
  };
}

function decodeCandidates(raw: string): string[] {
  const out: string[] = [raw];
  try {
    const once = decodeURIComponent(raw);
    if (once !== raw) out.push(once);
    try {
      const twice = decodeURIComponent(once);
      if (twice !== once) out.push(twice);
    } catch {
      /* ignore */
    }
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

function signSession(session: AuthSession): string {
  const payload = JSON.stringify(session);
  const secret = authSecret();
  if (!secret) return payload;

  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const body = Buffer.from(payload, "utf8").toString("base64url");
  return `${body}.${sig}`;
}

function allowLegacyUnsignedCookies(): boolean {
  return process.env.NODE_ENV !== "production";
}

function verifySigned(raw: string): AuthSession | null {
  const secret = authSecret();
  if (!secret) return allowLegacyUnsignedCookies() ? parseUnsigned(raw) : null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const bodyB64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(bodyB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return asSession(JSON.parse(payload));
}

export function serializeAuthCookie(session: AuthSession): string {
  return signSession(session);
}

export function parseAuthCookie(value?: string | null): AuthSession | null {
  if (!value) return null;
  try {
    let raw = value;
    if (value.includes(`${AUTH_COOKIE}=`) || value.includes(";")) {
      const match = value.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]*)`));
      raw = match?.[1] ? match[1] : "";
    }
    if (!raw) return null;

    const signed = verifySigned(raw);
    if (signed) return signed;

    // Legacy unsigned cookies (dev only — production requires AUTH_SECRET)
    if (!authSecret() && allowLegacyUnsignedCookies()) return parseUnsigned(raw);
    return null;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): AuthSession | null {
  return parseAuthCookie(request.headers.get("cookie"));
}
