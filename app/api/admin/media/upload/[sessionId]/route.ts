import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError, isAllowedUploadMime } from "@/lib/admin-media-guard";
import { uploadSessionFile } from "@/lib/filesir/client";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const { sessionId } = await context.params;
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "فایل ارسال نشده." }, { status: 400 });
  }
  if (!isAllowedUploadMime(file.type || "application/octet-stream")) {
    return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
  }

  try {
    const result = await uploadSessionFile(sessionId, file, file.name);
    return NextResponse.json({ ok: true, fileEntry: result.fileEntry });
  } catch (error) {
    return handleFilesIrError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const { sessionId } = await context.params;
  try {
    const { cancelUploadSession } = await import("@/lib/filesir/client");
    await cancelUploadSession(sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
