import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { liveSessionFromRequest } from "@/lib/live-session";
import { getDb, notifications, ticketMessages, tickets, users } from "@/lib/db";

export const runtime = "nodejs";

function sessionOf(request: Request) {
  return liveSessionFromRequest(request);
}

export async function GET(request: Request) {
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const db = getDb();
  const list =
    session.role === "admin"
      ? db.select().from(tickets).orderBy(desc(tickets.updatedAt)).all()
      : db
          .select()
          .from(tickets)
          .where(eq(tickets.userId, session.userId))
          .orderBy(desc(tickets.updatedAt))
          .all();

  const enriched = list.map((ticket) => {
    const user = db.select().from(users).where(eq(users.id, ticket.userId)).get();
    const messages = db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticket.id))
      .orderBy(ticketMessages.createdAt)
      .all();
    return { ...ticket, user, messages };
  });

  return NextResponse.json({ tickets: enriched });
}

export async function POST(request: Request) {
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  const orderId = body?.orderId ? Number(body.orderId) : null;

  if (!subject || !message) {
    return NextResponse.json({ message: "موضوع و پیام الزامی است" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const result = db
    .insert(tickets)
    .values({
      userId: session.userId,
      orderId,
      subject,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const ticketId = Number(result.lastInsertRowid);
  db.insert(ticketMessages)
    .values({
      ticketId,
      senderId: session.userId,
      senderRole: session.role,
      body: message,
      createdAt: now,
    })
    .run();

  return NextResponse.json({ ok: true, id: ticketId });
}

export async function PATCH(request: Request) {
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ message: "شناسه نامعتبر" }, { status: 400 });

  const db = getDb();
  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get();
  if (!ticket) return NextResponse.json({ message: "تیکت یافت نشد" }, { status: 404 });

  if (session.role !== "admin" && ticket.userId !== session.userId) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const now = new Date().toISOString();

  if (body?.message) {
    const msg = String(body.message).trim();
    if (!msg) return NextResponse.json({ message: "پیام خالی است" }, { status: 400 });

    db.insert(ticketMessages)
      .values({
        ticketId: id,
        senderId: session.userId,
        senderRole: session.role,
        body: msg,
        createdAt: now,
      })
      .run();

    const nextStatus =
      session.role === "admin" ? "answered" : ticket.status === "closed" ? "open" : ticket.status;

    db.update(tickets)
      .set({ status: nextStatus as typeof ticket.status, updatedAt: now })
      .where(eq(tickets.id, id))
      .run();

    const notifyUserId = session.role === "admin" ? ticket.userId : null;
    if (notifyUserId) {
      db.insert(notifications)
        .values({
          userId: notifyUserId,
          title: "پاسخ جدید تیکت",
          body: `به تیکت «${ticket.subject}» پاسخ داده شد.`,
          href: "/dashboard",
          read: false,
          createdAt: now,
        })
        .run();
    }
  }

  if (body?.status && session.role === "admin") {
    db.update(tickets)
      .set({ status: body.status, updatedAt: now })
      .where(eq(tickets.id, id))
      .run();
  }

  const updated = db.select().from(tickets).where(eq(tickets.id, id)).get();
  const messages = db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(ticketMessages.createdAt)
    .all();

  return NextResponse.json({ ok: true, ticket: updated, messages });
}
