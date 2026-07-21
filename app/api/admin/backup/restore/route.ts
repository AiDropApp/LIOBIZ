import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, findUserById, parseAuthCookie } from "@/lib/auth";
import {
  FULL_RESTORE,
  type RestoreScope,
  restoreBackupBuffer,
  restoreBackupFile,
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

function parseScope(form: FormData): RestoreScope {
  const mode = String(form.get("uploadMode") || "merge");
  return {
    database: form.get("database") === "true" || form.get("database") === "1",
    cms: form.get("cms") === "true" || form.get("cms") === "1",
    uploads: form.get("uploads") === "true" || form.get("uploads") === "1",
    uploadMode: mode === "replace" ? "replace" : "merge",
  };
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const form = await request.formData();
  const source = String(form.get("source") || "upload");

  let scope = parseScope(form);
  const full = form.get("full") === "true" || form.get("full") === "1";
  if (full) {
    scope = { ...FULL_RESTORE };
  }

  if (!scope.database && !scope.cms && !scope.uploads) {
    return NextResponse.json({ message: "حداقل یک بخش برای بازیابی انتخاب کنید." }, { status: 400 });
  }

  try {
    if (source === "server") {
      const id = String(form.get("id") || "");
      if (!id) {
        return NextResponse.json({ message: "شناسه بک‌آپ سرور الزامی است." }, { status: 400 });
      }
      const result = await restoreBackupFile(id, scope);
      return NextResponse.json({
        ok: true,
        message: "بازیابی با موفقیت انجام شد.",
        preRestoreId: result.preRestoreId,
        restoredAt: result.manifest.createdAt,
      });
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "فایل ZIP بک‌آپ الزامی است." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await restoreBackupBuffer(buffer, scope);
    return NextResponse.json({
      ok: true,
      message: "بازیابی با موفقیت انجام شد.",
      preRestoreId: result.preRestoreId,
      restoredAt: result.manifest.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "بازیابی ناموفق بود.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
