import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie, clearAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "وارد نشده‌اید." }, { status: 401 });
  }

  const user = findUserById(session.userId);
  if (!user || user.blocked) {
    const res = NextResponse.json(
      { message: user?.blocked ? "حساب شما مسدود شده است." : "کاربر یافت نشد." },
      { status: 401 },
    );
    clearAuthCookie(res);
    return res;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      company: user.company,
      blocked: Boolean(user.blocked),
      createdAt: user.createdAt,
    },
  });
}
