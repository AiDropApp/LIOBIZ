import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { getDb, users } from "@/lib/db";
import { readSiteContent } from "@/lib/content-store";
import { contactMessages } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const db = getDb();
  const allUsers = db.select().from(users).orderBy(desc(users.createdAt)).all();
  const clients = allUsers.filter((u) => u.role === "client");
  const messages = db.select().from(contactMessages).all();
  const newMessages = messages.filter((m) => m.status === "new").length;
  const content = await readSiteContent();

  return NextResponse.json({
    stats: {
      users: clients.length,
      messages: messages.length,
      newMessages,
      portfolio: content.portfolio.length,
      backstage: content.backstage.length,
    },
    users: clients.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company,
      createdAt: u.createdAt,
    })),
  });
}
