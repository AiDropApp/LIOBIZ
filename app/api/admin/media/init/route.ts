import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { hasLocalMediaFiles } from "@/lib/media-center/local-library";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

function isSection(v: string | null): v is MediaSection {
  return Boolean(v && MEDIA_SECTIONS.some((s) => s.id === v));
}

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const section = new URL(request.url).searchParams.get("section");
  const store = await readMediaCenterStore();
  const storageMode = store.storageMode === "filesir" ? "filesir" : "local";
  const localReady = await hasLocalMediaFiles();
  const filesirConfigured = isFilesIrConfigured();

  const categories = isSection(section)
    ? store.categories.filter((c) => c.section === section)
    : store.categories;
  const cards = isSection(section) ? store.cards.filter((c) => c.section === section) : store.cards;

  const bootstrapped =
    storageMode === "local"
      ? Boolean(store.rootFolderId) || localReady || store.cards.length > 0 || store.categories.length > 0
      : Boolean(store.rootFolderId);

  return NextResponse.json({
    ok: true,
    configured: storageMode === "local" ? true : filesirConfigured,
    filesirConfigured,
    storageMode,
    localReady,
    bootstrapped,
    store: {
      rootFolderId: store.rootFolderId,
      sectionFolderIds: store.sectionFolderIds,
      storageMode,
    },
    categories,
    cards,
  });
}
