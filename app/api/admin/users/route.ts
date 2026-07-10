import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { getDb, users } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const db = getDb();
  const all = db.select().from(users).orderBy(desc(users.createdAt)).all();
  const list = all
    .filter((u) => u.role === "client")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company,
      role: u.role,
      blocked: Boolean(u.blocked),
      createdAt: u.createdAt,
    }));

  return NextResponse.json({ users: list });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ message: "شناسه نامعتبر" }, { status: 400 });

  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user || user.role === "admin") {
    return NextResponse.json({ message: "کاربر یافت نشد" }, { status: 404 });
  }

  if (typeof body.blocked === "boolean") {
    db.update(users)
      .set({ blocked: body.blocked, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .run();
  }

  const updated = db.select().from(users).where(eq(users.id, id)).get();
  return NextResponse.json({
    ok: true,
    user: updated
      ? {
          ...updated,
          blocked: Boolean(updated.blocked),
        }
      : null,
  });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ message: "شناسه نامعتبر" }, { status: 400 });

  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user || user.role === "admin") {
    return NextResponse.json({ message: "کاربر یافت نشد" }, { status: 404 });
  }

  db.delete(users).where(eq(users.id, id)).run();
  return NextResponse.json({ ok: true });
}
