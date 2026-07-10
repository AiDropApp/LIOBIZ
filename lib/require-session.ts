import { cookies } from "next/headers";
import { AUTH_COOKIE, parseAuthCookie, type AuthSession } from "@/lib/auth-session";
import { findUserById } from "@/lib/auth";

/** Server-side session with live DB check (blocked / deleted). */
export async function getActiveSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) return null;

  const user = findUserById(session.userId);
  if (!user || user.blocked) return null;
  if (user.role !== session.role) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
