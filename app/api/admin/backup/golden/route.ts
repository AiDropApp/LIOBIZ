import { spawn } from "child_process";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import {
  isGoldenBackupRunning,
  readGoldenBackupStatus,
  runGoldenBackupJob,
} from "@/lib/golden-backup";
import { listGoldenBackupSets, MAX_GOLDEN_BACKUPS } from "@/lib/golden-backup-myfiles";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const [sets, status, running] = await Promise.all([
    listGoldenBackupSets(),
    readGoldenBackupStatus(),
    isGoldenBackupRunning(),
  ]);

  return NextResponse.json({
    ok: true,
    maxGoldenBackups: MAX_GOLDEN_BACKUPS,
    sets,
    status,
    running,
  });
}

function spawnGoldenBackupBackground() {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts", "run-golden-backup.ts");
  const child = spawn("/usr/bin/node", [path.join(cwd, "node_modules/tsx/dist/cli.mjs"), script], {
    cwd,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  let body: { mode?: string; wait?: boolean } = {};
  try {
    body = (await request.json()) as { mode?: string; wait?: boolean };
  } catch {
    body = {};
  }

  if (await isGoldenBackupRunning()) {
    return NextResponse.json(
      { message: "یک Golden Backup در حال اجراست. لطفاً تا پایان آن صبر کنید." },
      { status: 409 },
    );
  }

  if (body.wait) {
    try {
      const result = await runGoldenBackupJob({ forceNew: true });
      return NextResponse.json({
        ok: true,
        filename: result.filename,
        uploaded: result.uploaded,
        message: "Golden Backup با موفقیت به MyFiles ارسال شد.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Golden Backup ناموفق بود.";
      return NextResponse.json({ message }, { status: 500 });
    }
  }

  spawnGoldenBackupBackground();
  return NextResponse.json({
    ok: true,
    started: true,
    message: "Golden Backup در پس‌زمینه شروع شد. وضعیت را از همین صفحه پیگیری کنید.",
  });
}
