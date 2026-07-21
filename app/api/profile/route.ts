import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE, findUserById, parseAuthCookie, setAuthCookie, toSession } from "@/lib/auth";
import { getDb, users } from "@/lib/db";

export const runtime = "nodejs";

function profilePayload(user: NonNullable<ReturnType<typeof findUserById>>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    company: user.company,
    createdAt: user.createdAt,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const user = findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ message: "کاربر یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: profilePayload(user) });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const phone = String(body?.phone || "").trim() || null;
  const company = String(body?.company || "").trim() || null;

  if (!name) {
    return NextResponse.json({ message: "نام الزامی است." }, { status: 400 });
  }

  const db = getDb();
  db.update(users)
    .set({ name, phone, company })
    .where(eq(users.id, session.userId))
    .run();

  const user = findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ message: "کاربر یافت نشد." }, { status: 404 });
  }

  const nextSession = toSession(user);
  const response = NextResponse.json({
    ok: true,
    user: profilePayload(user),
  });
  setAuthCookie(response, nextSession);
  return response;
}
