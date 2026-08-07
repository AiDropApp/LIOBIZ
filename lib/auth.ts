import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import {
  AUTH_COOKIE,
  type AuthSession,
  type UserRole,
  serializeAuthCookie,
} from "@/lib/auth-session";

export {
  AUTH_COOKIE,
  parseAuthCookie,
  type AuthSession,
  type UserRole,
} from "@/lib/auth-session";

export const ADMIN_DEMO = {
  email: "admin@liobiz.com",
  password: "Admin@12345",
  name: "مدیر لیوبیز",
  role: "admin" as const,
};

export function toSession(user: User): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function setAuthCookie(response: NextResponse, session: AuthSession) {
  // Do NOT pre-encode: Next.js cookies.set already percent-encodes the value.
  // Double-encoding broke liveSessionFromRequest (orders/tickets/notifications)
  // which reads the raw Cookie header (one decode less than cookies().get()).
  response.cookies.set(AUTH_COOKIE, serializeAuthCookie(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function findUserByEmail(email: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
}

export function findUserById(id: number) {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function redirectForRole(role: UserRole) {
  return role === "admin" ? "/admin" : "/dashboard";
}
