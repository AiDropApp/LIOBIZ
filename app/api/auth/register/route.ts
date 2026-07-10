import { NextResponse } from "next/server";
import {
  findUserByEmail,
  hashPassword,
  redirectForRole,
  setAuthCookie,
  toSession,
} from "@/lib/auth";
import { getDb, users } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();

  if (!email || !password || !name) {
    return NextResponse.json({ message: "نام، ایمیل و رمز عبور الزامی است." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ message: "رمز عبور حداقل ۶ کاراکتر باشد." }, { status: 400 });
  }

  if (findUserByEmail(email)) {
    return NextResponse.json({ message: "این ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const db = getDb();
  const created = db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "client",
      phone: null,
      company: null,
      blocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning()
    .get();

  const session = toSession(created);
  const response = NextResponse.json({
    ok: true,
    redirect: redirectForRole(session.role),
    user: session,
  });
  setAuthCookie(response, session);
  return response;
}
