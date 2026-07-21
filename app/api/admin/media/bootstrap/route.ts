import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { ensureFolder } from "@/lib/filesir/client";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { readMediaCenterStore, saveBootstrap } from "@/lib/media-center/store";

export const runtime = "nodejs";

export async function POST() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  try {
    const store = await readMediaCenterStore();
    const root = store.rootFolderId
      ? { id: store.rootFolderId, name: "Liobiz", type: "folder" as const }
      : await ensureFolder("Liobiz", null);

    store.rootFolderId = root.id;
    store.sectionFolderIds = store.sectionFolderIds || {};

    for (const section of MEDIA_SECTIONS) {
      if (!store.sectionFolderIds[section.id as MediaSection]) {
        const folder = await ensureFolder(section.folderName, root.id);
        store.sectionFolderIds[section.id as MediaSection] = folder.id;
      }
    }

    await saveBootstrap(store);
    return NextResponse.json({ ok: true, store });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
