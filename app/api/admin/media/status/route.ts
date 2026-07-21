import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

export async function GET() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const store = await readMediaCenterStore();
  return NextResponse.json({
    ok: true,
    configured: isFilesIrConfigured(),
    bootstrapped: Boolean(store.rootFolderId),
    store: {
      rootFolderId: store.rootFolderId,
      sectionFolderIds: store.sectionFolderIds,
      categoriesCount: store.categories.length,
      cardsCount: store.cards.length,
    },
  });
}
