import { spawn } from "child_process";
import { readFileSync } from "fs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import { isGoldenBackupRunning } from "@/lib/golden-backup";

export const runtime = "nodejs";

const RESTORE_STATUS_PATH = path.join(process.cwd(), "data", ".golden-restore-status.json");

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") return null;
  const admin = findUserById(session.userId);
  if (!admin || admin.blocked || admin.role !== "admin") return null;
  return admin;
}

function readRestoreStatus() {
  try {
    return JSON.parse(readFileSync(RESTORE_STATUS_PATH, "utf8")) as {
      state: string;
      setId?: string;
      message?: string;
      startedAt?: string;
      finishedAt?: string;
    };
  } catch {
    return { state: "idle" };
  }
}

function spawnGoldenRestoreBackground(setId: string) {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts", "run-golden-restore.ts");
  const child = spawn("/usr/bin/node", [path.join(cwd, "node_modules/tsx/dist/cli.mjs"), script, setId], {
    cwd,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    status: readRestoreStatus(),
    backupRunning: await isGoldenBackupRunning(),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  let body: { setId?: string } = {};
  try {
    body = (await request.json()) as { setId?: string };
  } catch {
    body = {};
  }

  const setId = body.setId?.trim();
  if (!setId) {
    return NextResponse.json({ message: "شناسه Golden Backup الزامی است." }, { status: 400 });
  }

  const restoreStatus = readRestoreStatus();
  if (restoreStatus.state === "running") {
    return NextResponse.json({ message: "یک بازیابی Golden در حال اجراست." }, { status: 409 });
  }

  if (await isGoldenBackupRunning()) {
    return NextResponse.json({ message: "ابتدا Golden Backup در حال اجرا را متوقف/تمام کنید." }, { status: 409 });
  }

  spawnGoldenRestoreBackground(setId);
  return NextResponse.json({
    ok: true,
    started: true,
    setId,
    message:
      "بازیابی Golden در پس‌زمینه شروع شد. کل پروژه (media، DB، CMS، کد) از MyFiles بازگردانی می‌شود. پس از اتمام سرویس را restart کنید.",
  });
}
