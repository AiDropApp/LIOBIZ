import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import type { MediaSection } from "@/lib/filesir/types";
import { buildEntryLinkMap } from "@/lib/media-center/asset-utils";
import { categoryDiskPrefixes } from "@/lib/media-center/categories";
import { listLocalMediaFlat } from "@/lib/media-center/local-library";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const query = url.searchParams.get("query") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const scope = url.searchParams.get("scope") || "folder";
  const section = url.searchParams.get("section") as MediaSection | null;
  const unlinkedOnly = url.searchParams.get("unlinkedOnly") === "1";
  const linkedOnly = url.searchParams.get("linkedOnly") === "1";
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const sort = url.searchParams.get("sort") || "name";

  try {
    const store = await readMediaCenterStore();
    const linkMap = buildEntryLinkMap(store.cards);

    let categoryPathPrefixes: string[] | undefined;
    if (categoryId) {
      categoryPathPrefixes = categoryDiskPrefixes(store.categories, categoryId);
    }

    let localEntries = await listLocalMediaFlat({
      section: scope === "liobiz" || scope === "all" ? null : section,
      query,
      categoryPathPrefixes,
      categories: store.categories,
      cards: store.cards,
    });

    if (type) {
      const wanted = new Set(type.split(",").map((t) => t.trim()).filter(Boolean));
      if (wanted.size) localEntries = localEntries.filter((e) => wanted.has(e.type));
    }

    if (unlinkedOnly) localEntries = localEntries.filter((e) => !linkMap.has(e.id));
    if (linkedOnly) localEntries = localEntries.filter((e) => linkMap.has(e.id));

    if (sort === "size") {
      localEntries = [...localEntries].sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
    } else {
      localEntries = [...localEntries].sort((a, b) => a.name.localeCompare(b.name, "fa"));
    }

    const enriched = localEntries.map((e) => ({
      ...e,
      linked: linkMap.get(e.id) || null,
    }));

    const stats = {
      total: localEntries.length,
      linked: localEntries.filter((e) => linkMap.has(e.id)).length,
      free: localEntries.filter((e) => !linkMap.has(e.id)).length,
    };

    return NextResponse.json({
      ok: true,
      storageMode: "local",
      entries: enriched,
      breadcrumbs: [{ id: null, name: "سرور" }],
      stats,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطا در بارگذاری فایل‌ها";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
