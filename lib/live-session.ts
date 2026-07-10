import { parseAuthCookie, type AuthSession } from "@/lib/auth-session";
import { findUserById } from "@/lib/auth";

/** Resolve session from Request Cookie header and reject blocked/deleted users. */
export function liveSessionFromRequest(request: Request): AuthSession | null {
  const session = parseAuthCookie(request.headers.get("cookie"));
  if (!session) return null;
  const user = findUserById(session.userId);
  if (!user || user.blocked) return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
