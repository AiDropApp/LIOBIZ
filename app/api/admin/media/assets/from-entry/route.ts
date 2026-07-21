import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { entryKind, getOrCreateShareableLink, moveEntries, toAssetRef, updateEntry } from "@/lib/filesir/client";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { resolveTargetFolderId } from "@/lib/media-center/sync-folders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const body = await request.json().catch(() => null);
  const entryId = Number(body?.entryId);
  if (!entryId) {
    return NextResponse.json({ message: "entryId الزامی است." }, { status: 400 });
  }

  try {
    const store = await readMediaCenterStore();
    let targetFolderId: number | null = body?.targetFolderId != null ? Number(body.targetFolderId) : null;

    if (targetFolderId == null && body?.section) {
      const fakeCard = {
        section: body.section,
        categoryId: body?.categoryId ?? null,
      } as Parameters<typeof resolveTargetFolderId>[0];
      targetFolderId = resolveTargetFolderId(fakeCard, store);
    }

    if (body?.move !== false && targetFolderId) {
      await moveEntries([entryId], targetFolderId);
    }

    if (body?.description) {
      await updateEntry(entryId, { description: String(body.description) }).catch(() => undefined);
    }

    const { link, publicUrl } = await getOrCreateShareableLink(entryId);
    const asset = toAssetRef(
      {
        id: entryId,
        name: String(body?.fileName || "file"),
        type: body?.type || "image",
        mime: body?.mime,
      },
      publicUrl,
      link.hash,
    );

    return NextResponse.json({ ok: true, asset, link, publicUrl });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
