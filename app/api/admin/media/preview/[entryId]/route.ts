import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { proxyFilesIrEntry } from "@/lib/media-center/filesir-proxy";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const entryId = Number((await params).entryId);
  if (!entryId) {
    return Response.json({ message: "entryId نامعتبر" }, { status: 400 });
  }

  try {
    return await proxyFilesIrEntry(request, entryId);
  } catch (error) {
    return handleFilesIrError(error);
  }
}
