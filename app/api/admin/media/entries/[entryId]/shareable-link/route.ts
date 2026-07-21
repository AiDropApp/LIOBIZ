import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { getOrCreateShareableLink } from "@/lib/filesir/client";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ entryId: string }> }) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const { entryId } = await context.params;
  const id = Number(entryId);
  if (!id) return NextResponse.json({ message: "entryId نامعتبر" }, { status: 400 });

  try {
    const result = await getOrCreateShareableLink(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
