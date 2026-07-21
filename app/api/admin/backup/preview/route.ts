import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import { deleteBackup, previewRestore } from "@/lib/backup";

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
    const preview = await previewRestore(id);
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "پیش‌نمایش ناموفق بود.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
