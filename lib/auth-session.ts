export const AUTH_COOKIE = "liobiz_auth";

export type UserRole = "admin" | "client";

export type AuthSession = {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
};

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
    const decoded = decodeURIComponent(raw);
    const data = JSON.parse(decoded) as AuthSession;
    if (!data?.userId || !data?.email || !data?.role) return null;
    if (data.role !== "admin" && data.role !== "client") return null;
    return data;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): AuthSession | null {
  return parseAuthCookie(request.headers.get("cookie"));
}
