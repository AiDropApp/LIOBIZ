import { NextResponse } from "next/server";
import {
  findUserByEmail,
  redirectForRole,
  setAuthCookie,
  toSession,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "").trim();

  if (!email || !password) {
    return NextResponse.json({ message: "ایمیل و رمز عبور الزامی است." }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ message: "ایمیل یا رمز عبور نادرست است." }, { status: 401 });
  }

  if (user.blocked) {
    return NextResponse.json({ message: "حساب شما توسط مدیر مسدود شده است." }, { status: 403 });
  }

  const session = toSession(user);
  const response = NextResponse.json({
    ok: true,
    redirect: redirectForRole(session.role),
    user: session,
  });
  setAuthCookie(response, session);
  return response;
}
