import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import {
  MAX_AUTO_BACKUPS,
  MANUAL_BACKUP_FILENAME,
  createBackup,
  deleteBackup,
  listBackupGroups,
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

  const groups = await listBackupGroups();
  return NextResponse.json({
    ok: true,
    maxAutoBackups: MAX_AUTO_BACKUPS,
    manualFilename: MANUAL_BACKUP_FILENAME,
    autoBackups: groups.auto,
    manualBackup: groups.manual,
    preRestoreBackups: groups.preRestore,
    /** @deprecated */ backups: [...groups.auto, ...(groups.manual ? [groups.manual] : []), ...groups.preRestore],
    /** @deprecated */ maxBackups: MAX_AUTO_BACKUPS,
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
  return NextResponse.json({ ok: true, backup, message: "آخرین بک‌آپ دستی ذخیره شد." });
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
    const groups = await listBackupGroups();
    return NextResponse.json({
      ok: true,
      message: "بک‌آپ حذف شد.",
      autoBackups: groups.auto,
      manualBackup: groups.manual,
      preRestoreBackups: groups.preRestore,
      backups: [...groups.auto, ...(groups.manual ? [groups.manual] : []), ...groups.preRestore],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حذف ناموفق بود.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
