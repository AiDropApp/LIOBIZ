export const AUTH_COOKIE = "liobiz_auth";

export type UserRole = "admin" | "client";

export type AuthSession = {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
};

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

/** Decode once or twice — Next.js may already encode cookie values. */
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

export function parseAuthCookie(value?: string | null): AuthSession | null {
  if (!value) return null;
  try {
    // Accept either raw cookie value OR full Cookie header
    let raw = value;
    if (value.includes(`${AUTH_COOKIE}=`) || value.includes(";")) {
      const match = value.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]*)`));
      raw = match?.[1] ? match[1] : "";
    }
    if (!raw) return null;

    for (const candidate of decodeCandidates(raw)) {
      try {
        const session = asSession(JSON.parse(candidate));
        if (session) return session;
      } catch {
        /* try next candidate */
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): AuthSession | null {
  return parseAuthCookie(request.headers.get("cookie"));
}
