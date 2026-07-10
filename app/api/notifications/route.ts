import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { liveSessionFromRequest } from "@/lib/live-session";
import { getDb, notifications } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = liveSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const db = getDb();
  const list = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.userId))
    .orderBy(desc(notifications.createdAt))
    .all();

  return NextResponse.json({ notifications: list });
}

export async function PATCH(request: Request) {
  const session = liveSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "وارد شوید" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const db = getDb();

  if (body?.all) {
    db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.userId))
      .run();
    return NextResponse.json({ ok: true });
  }

  const id = Number(body?.id);
  if (!id) return NextResponse.json({ message: "شناسه نامعتبر" }, { status: 400 });

  const item = db.select().from(notifications).where(eq(notifications.id, id)).get();
  if (!item || item.userId !== session.userId) {
    return NextResponse.json({ message: "یافت نشد" }, { status: 404 });
  }

  db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).run();
  return NextResponse.json({ ok: true });
}
