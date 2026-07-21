import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import {
  MAX_BACKUPS,
  createBackup,
  deleteBackup,
  listBackups,
  runAutoBackupIfNeeded,
} from "@/lib/backup";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") return null;
  const admin = findUserById(session.userId);
  if (!admin || admin.blocked || admin.role !== "admin") return null;
  return admin;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const backups = await listBackups();
  return NextResponse.json({
    ok: true,
    maxBackups: MAX_BACKUPS,
    backups,
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    body = {};
  }

  if (body.action === "auto") {
    const result = await runAutoBackupIfNeeded();
    if (result.skipped) {
      return NextResponse.json({ ok: true, skipped: true, message: "بک‌آپ خودکار امروز قبلاً گرفته شده." });
    }
    return NextResponse.json({ ok: true, backup: result.entry });
  }

  const backup = await createBackup("manual");
  return NextResponse.json({ ok: true, backup });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "شناسه بک‌آپ الزامی است." }, { status: 400 });
  }

  try {
    await deleteBackup(id);
    const backups = await listBackups();
    return NextResponse.json({ ok: true, message: "بک‌آپ حذف شد.", backups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حذف ناموفق بود.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
