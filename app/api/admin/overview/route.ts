import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import { getDb, users, orders, tickets, contactMessages } from "@/lib/db";
import { readPublicSiteContent } from "@/lib/content-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = findUserById(session.userId);
  if (!admin || admin.blocked || admin.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const db = getDb();
  const allUsers = db.select().from(users).orderBy(desc(users.createdAt)).all();
  const clients = allUsers.filter((u) => u.role === "client");
  const messages = db.select().from(contactMessages).all();
  const newMessages = messages.filter((m) => m.status === "new").length;
  const allOrders = db.select().from(orders).all();
  const allTickets = db.select().from(tickets).all();
  const openTickets = allTickets.filter((t) => t.status !== "closed").length;
  const newOrders = allOrders.filter((o) => o.status === "new").length;
  const content = await readPublicSiteContent();

  return NextResponse.json({
    stats: {
      users: clients.length,
      messages: messages.length,
      newMessages,
      portfolio: content.portfolio.length,
      backstage: content.backstage.length,
      orders: allOrders.length,
      newOrders,
      tickets: allTickets.length,
      openTickets,
    },
    users: clients.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company,
      blocked: Boolean(u.blocked),
      blockReason: u.blockReason || null,
      createdAt: u.createdAt,
    })),
  });
}
