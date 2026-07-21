import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { signUploadParts } from "@/lib/filesir/client";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const { sessionId } = await context.params;
  const body = await request.json().catch(() => null);
  const partNumbers = Array.isArray(body?.partNumbers) ? body.partNumbers.map(Number) : [];
  if (!partNumbers.length) {
    return NextResponse.json({ message: "partNumbers الزامی است." }, { status: 400 });
  }

  try {
    const signed = await signUploadParts(sessionId, partNumbers);
    return NextResponse.json({ ok: true, ...signed });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
