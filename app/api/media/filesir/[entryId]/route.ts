import { NextResponse } from "next/server";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import { isPublicFilesIrEntry } from "@/lib/media-center/public-access";
import { proxyFilesIrEntry } from "@/lib/media-center/filesir-proxy";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  if (!isFilesIrConfigured()) {
    return NextResponse.json({ message: "Files.ir پیکربندی نشده." }, { status: 503 });
  }

  const entryId = Number((await params).entryId);
  if (!entryId) {
    return NextResponse.json({ message: "entryId نامعتبر" }, { status: 400 });
  }

  const allowed = await isPublicFilesIrEntry(entryId);
  if (!allowed) {
    return NextResponse.json({ message: "دسترسی مجاز نیست." }, { status: 403 });
  }

  return proxyFilesIrEntry(request, entryId);
}
