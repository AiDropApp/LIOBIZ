import { createReadStream, promises as fs } from "fs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import { getBackupPath } from "@/lib/backup";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") return null;
  const admin = findUserById(session.userId);
  if (!admin || admin.blocked || admin.role !== "admin") return null;
  return admin;
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "شناسه بک‌آپ الزامی است." }, { status: 400 });
  }

  try {
    const filePath = getBackupPath(id);
    await fs.access(filePath);
    const stat = await fs.stat(filePath);
    const stream = createReadStream(filePath);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(id)}"`,
        "Content-Length": String(stat.size),
      },
    });
  } catch {
    return NextResponse.json({ message: "فایل بک‌آپ یافت نشد." }, { status: 404 });
  }
}
