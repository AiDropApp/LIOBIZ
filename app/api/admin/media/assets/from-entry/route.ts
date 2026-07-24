import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { entryKind, getOrCreateShareableLink, moveEntries, toAssetRef, updateEntry } from "@/lib/filesir/client";
import type { MediaAssetRef } from "@/lib/filesir/types";
import { getLocalEntry } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { resolveTargetFolderId } from "@/lib/media-center/sync-folders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const entryId = Number(body?.entryId);
  if (!entryId) {
    return NextResponse.json({ message: "entryId الزامی است." }, { status: 400 });
  }

  try {
    const store = await readMediaCenterStore();
    const storageMode = store.storageMode === "filesir" ? "filesir" : "local";
    const localPath = typeof body?.localPath === "string" ? body.localPath.trim() : "";
    const mapped = await getLocalEntry(entryId);

    if (storageMode === "local" || localPath || mapped?.localPath) {
      const path = localPath || mapped?.localPath || "";
      if (!path) {
        return NextResponse.json(
          { message: "این فایل روی سرور پیدا نشد. حالت ذخیره را روی سرور بگذارید یا مهاجرت را کامل کنید." },
          { status: 404 },
        );
      }
      const kind =
        body?.type === "video" || mapped?.kind === "video"
          ? "video"
          : body?.type === "image" || mapped?.kind === "image"
            ? "image"
            : entryKind({
                id: entryId,
                name: String(body?.fileName || mapped?.fileName || "file"),
                type: body?.type || mapped?.kind || "image",
                mime: body?.mime || mapped?.mime,
              });
      const asset: MediaAssetRef = {
        entryId,
        shareUrl: publicMediaUrl(path),
        mime: body?.mime || mapped?.mime,
        fileName: String(body?.fileName || mapped?.fileName || path.split("/").pop() || "file"),
        kind,
        localPath: path,
      };
      return NextResponse.json({ ok: true, asset, storageMode: "local" });
    }

    const cfg = filesIrGuard();
    if (cfg) return cfg;

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

    return NextResponse.json({ ok: true, asset, link, publicUrl, storageMode: "filesir" });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
