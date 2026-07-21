import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { moveEntries, updateEntry } from "@/lib/filesir/client";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { resolveTargetFolderId } from "@/lib/media-center/sync-folders";
import type { MediaSection } from "@/lib/filesir/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const entryId = Number((await params).entryId);
  if (!entryId) {
    return NextResponse.json({ message: "entryId نامعتبر" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  try {
    const store = await readMediaCenterStore();
    const patch: { name?: string; description?: string } = {};

    if (typeof body?.description === "string") {
      patch.description = body.description.trim();
    }
    if (typeof body?.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }

    if (Object.keys(patch).length > 0) {
      await updateEntry(entryId, patch);
    }

    if (body?.categoryId !== undefined || body?.section) {
      const fakeCard = {
        section: (body?.section || "portfolio") as MediaSection,
        categoryId: body?.categoryId ?? null,
      } as Parameters<typeof resolveTargetFolderId>[0];
      const targetFolderId = resolveTargetFolderId(fakeCard, store);
      if (targetFolderId) {
        await moveEntries([entryId], targetFolderId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
