import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
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

  const categories = isSection(section)
    ? store.categories.filter((c) => c.section === section)
    : store.categories;
  const cards = isSection(section) ? store.cards.filter((c) => c.section === section) : store.cards;

  return NextResponse.json({
    ok: true,
    configured: isFilesIrConfigured(),
    bootstrapped: Boolean(store.rootFolderId),
    store: {
      rootFolderId: store.rootFolderId,
      sectionFolderIds: store.sectionFolderIds,
    },
    categories,
    cards,
  });
}
