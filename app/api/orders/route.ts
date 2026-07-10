import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { liveSessionFromRequest } from "@/lib/live-session";
import { getDb, notifications, orderFiles, orders, users } from "@/lib/db";

export const runtime = "nodejs";

function sessionOf(request: Request) {
  return liveSessionFromRequest(request);
}

async function notify(userId: number, title: string, body: string, href?: string) {
  const db = getDb();
  db.insert(notifications)
    .values({
      userId,
      title,
      body,
      href: href || "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export async function GET(request: Request) {
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const db = getDb();
  if (session.role === "admin") {
    const list = db.select().from(orders).orderBy(desc(orders.createdAt)).all();
    const withUser = list.map((order) => {
      const user = db.select().from(users).where(eq(users.id, order.userId)).get();
      const files = db.select().from(orderFiles).where(eq(orderFiles.orderId, order.id)).all();
      return { ...order, user, files };
    });
    return NextResponse.json({ orders: withUser });
  }

  const list = db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.userId))
    .orderBy(desc(orders.createdAt))
    .all();
  const withFiles = list.map((order) => ({
    ...order,
    files: db.select().from(orderFiles).where(eq(orderFiles.orderId, order.id)).all(),
  }));
  return NextResponse.json({ orders: withFiles });
}

export async function POST(request: Request) {
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const user = getDb().select().from(users).where(eq(users.id, session.userId)).get();
  if (!user || user.blocked) {
    return NextResponse.json({ message: "حساب شما مسدود است" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const service = String(body?.service || "").trim();
  const description = String(body?.description || "").trim();
  const budget = String(body?.budget || "").trim() || null;

  if (!title || !service || !description) {
    return NextResponse.json({ message: "عنوان، خدمت و توضیحات الزامی است" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const result = db
    .insert(orders)
    .values({
      userId: session.userId,
      title,
      service,
      description,
      budget,
      status: "new",
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) });
}

export async function PATCH(request: Request) {
  const session = sessionOf(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ message: "شناسه نامعتبر" }, { status: 400 });

  const db = getDb();
  const order = db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return NextResponse.json({ message: "سفارش یافت نشد" }, { status: 404 });

  const status = body?.status as typeof order.status | undefined;
  const adminNote =
    body?.adminNote !== undefined ? String(body.adminNote || "").trim() || null : order.adminNote;

  db.update(orders)
    .set({
      status: status || order.status,
      adminNote,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(orders.id, id))
    .run();

  if (status && status !== order.status) {
    const labels: Record<string, string> = {
      new: "جدید",
      review: "بررسی",
      in_progress: "در حال انجام",
      completed: "تکمیل",
      cancelled: "لغو",
    };
    const label = labels[status] || status;
    await notify(
      order.userId,
      "به‌روزرسانی سفارش",
      `وضعیت سفارش «${order.title}» به «${label}» تغییر کرد.`,
      "/dashboard",
    );
  }

  const updated = db.select().from(orders).where(eq(orders.id, id)).get();
  return NextResponse.json({ ok: true, order: updated });
}
