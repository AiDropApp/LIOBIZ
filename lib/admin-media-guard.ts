import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import { FilesIrError } from "@/lib/filesir/auth";
import { isFilesIrConfigured } from "@/lib/filesir/config";

function verifyAdminSession(session: ReturnType<typeof parseAuthCookie>) {
  if (session?.role !== "admin") return null;
  const admin = findUserById(session.userId);
  if (!admin || admin.blocked || admin.role !== "admin") return null;
  return admin;
}

export function requireAdminFromRequest(request: Request) {
  const session = parseAuthCookie(request.headers.get("cookie"));
  return verifyAdminSession(session);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  return verifyAdminSession(session);
}

export async function adminGuard() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }
  return admin;
}

export function filesIrGuard() {
  if (!isFilesIrConfigured()) {
    return NextResponse.json(
      {
        message:
          "Files.ir پیکربندی نشده. FILESIR_ACCESS_TOKEN یا FILESIR_EMAIL/PASSWORD را در .env.local تنظیم کنید.",
        configured: false,
      },
      { status: 503 },
    );
  }
  return null;
}

export function handleFilesIrError(error: unknown) {
  if (error instanceof FilesIrError) {
    return NextResponse.json({ message: error.message, details: error.body }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "خطای ناشناخته";
  return NextResponse.json({ message }, { status: 500 });
}

export function isAllowedUploadMime(mime: string) {
  return mime.startsWith("image/") || mime.startsWith("video/");
}
