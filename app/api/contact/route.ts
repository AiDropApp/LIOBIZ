import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { contactMessages, getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = String(body?.phone || "").trim();
  const message = String(body?.message || "").trim();

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ message: "لطفاً همه فیلدها را تکمیل کنید." }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ message: "ایمیل معتبر نیست." }, { status: 400 });
  }

  const db = getDb();
  db.insert(contactMessages)
    .values({
      name,
      email,
      phone,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    })
    .run();

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const db = getDb();

  if (session.role === "admin") {
    const rows = db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).all();
    return NextResponse.json({ messages: rows });
  }

  const rows = db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.email, session.email))
    .orderBy(desc(contactMessages.createdAt))
    .all();
  return NextResponse.json({ messages: rows });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const status = String(body?.status || "");
  if (!id || !["new", "read", "closed"].includes(status)) {
    return NextResponse.json({ message: "داده نامعتبر" }, { status: 400 });
  }

  const db = getDb();
  db.update(contactMessages)
    .set({ status: status as "new" | "read" | "closed" })
    .where(eq(contactMessages.id, id))
    .run();

  const rows = db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).all();
  return NextResponse.json({ ok: true, messages: rows });
}
