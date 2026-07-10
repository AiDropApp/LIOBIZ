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
    const decoded = decodeURIComponent(value);
    const data = JSON.parse(decoded) as AuthSession;
    if (!data?.userId || !data?.email || !data?.role) return null;
    if (data.role !== "admin" && data.role !== "client") return null;
    return data;
  } catch {
    return null;
  }
}
