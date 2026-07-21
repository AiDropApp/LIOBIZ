import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { completeUpload } from "@/lib/filesir/client";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const { sessionId } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const result = await completeUpload(sessionId, {
      parts: Array.isArray(body?.parts) ? body.parts : undefined,
      uploadKey: body?.uploadKey ? String(body.uploadKey) : undefined,
    });
    return NextResponse.json({ ok: true, fileEntry: result.fileEntry });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
