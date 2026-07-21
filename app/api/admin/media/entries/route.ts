import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { listFileEntries } from "@/lib/filesir/client";
import type { FilesIrFileEntry } from "@/lib/filesir/types";
import type { MediaSection } from "@/lib/filesir/types";
import { buildEntryLinkMap } from "@/lib/media-center/asset-utils";
import { descendantCategoryIds } from "@/lib/media-center/categories";
import { listLiobizMediaFlat, listSectionMediaFlat, type SectionMediaEntry } from "@/lib/media-center/library-entries";
import { clearEntriesCache, getEntriesCache, setEntriesCache } from "@/lib/media-center/entries-cache";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const url = new URL(request.url);
  const parentIdParam = url.searchParams.get("parentId");
  const query = url.searchParams.get("query") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const scope = url.searchParams.get("scope") || "folder";
  const section = url.searchParams.get("section") as MediaSection | null;
  const unlinkedOnly = url.searchParams.get("unlinkedOnly") === "1";
  const linkedOnly = url.searchParams.get("linkedOnly") === "1";
  const filesOnly = url.searchParams.get("filesOnly") === "1";
  const mediaOnly = url.searchParams.get("mediaOnly") === "1";
  const includeFolders = url.searchParams.get("includeFolders") === "1";
  const flat = url.searchParams.get("flat") === "1";
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const sort = url.searchParams.get("sort") || "name";

  try {
    const store = await readMediaCenterStore();
    const linkMap = buildEntryLinkMap(store.cards);

    const cacheKey = [
      scope,
      section ?? "",
      parentIdParam ?? "",
      categoryId ?? "",
      query ?? "",
      type ?? "",
      flat ? "1" : "0",
      unlinkedOnly ? "1" : "0",
      linkedOnly ? "1" : "0",
      sort,
    ].join("|");

    if (flat || scope === "liobiz") {
      const cached = getEntriesCache<{
        entries: (FilesIrFileEntry | SectionMediaEntry)[];
        breadcrumbs: { id: number | null; name: string }[];
        stats: { total: number; linked: number; free: number };
      }>(cacheKey);
      if (cached) {
        return NextResponse.json({
          ok: true,
          entries: cached.entries.map((e) => ({ ...e, linked: linkMap.get(e.id) || null })),
          breadcrumbs: cached.breadcrumbs,
          rootFolderId: store.rootFolderId ?? null,
          sectionFolderIds: store.sectionFolderIds,
          stats: cached.stats,
          cached: true,
        });
      }
    }

    let entries: FilesIrFileEntry[] | SectionMediaEntry[];

    if (flat && section) {
      let flatEntries = await listSectionMediaFlat(store, section);
      if (categoryId) {
        const allowedCats = descendantCategoryIds(store.categories, categoryId);
        const folderIds = new Set(
          store.categories.filter((c) => allowedCats.has(c.id)).map((c) => c.folderId),
        );
        if (folderIds.size) {
          flatEntries = flatEntries.filter((e) => folderIds.has(e.folderId));
        }
      }
      if (query) {
        const q = query.toLowerCase();
        flatEntries = flatEntries.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.description || "").toLowerCase().includes(q) ||
            e.folderLabel.toLowerCase().includes(q),
        );
      }
      entries = flatEntries;
    } else if (scope === "liobiz" && store.rootFolderId) {
      let flatEntries = await listLiobizMediaFlat(store);
      if (query) {
        const q = query.toLowerCase();
        flatEntries = flatEntries.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.description || "").toLowerCase().includes(q) ||
            e.folderLabel.toLowerCase().includes(q),
        );
      }
      entries = flatEntries;
    } else if (scope === "all") {
      entries = await listFileEntries({
        query: query || undefined,
        type: type || undefined,
        perPage: 200,
      });
      entries = entries.filter((e) => e.type === "image" || e.type === "video" || e.type === "folder");
    } else {
      let parentIds: number[] | undefined;
      if (scope === "folder" && parentIdParam && parentIdParam !== "all") {
        parentIds = [Number(parentIdParam)];
      } else if (scope === "folder" && section && store.sectionFolderIds[section]) {
        parentIds = [store.sectionFolderIds[section]];
      } else if (scope === "liobiz" && store.rootFolderId) {
        parentIds = [store.rootFolderId];
      }

      entries = await listFileEntries({
        parentIds: scope === "all" ? undefined : parentIds,
        query: scope === "all" || query ? query : undefined,
        type: type || undefined,
        perPage: 200,
      });
    }

    if (filesOnly && !includeFolders && !flat) {
      entries = entries.filter((e) => e.type !== "folder");
    }

    if (mediaOnly && !flat) {
      entries = entries.filter((e) => e.type === "folder" || e.type === "image" || e.type === "video");
    }

    const mediaEntriesForStats = entries.filter((e) => e.type !== "folder");

    if (unlinkedOnly) {
      entries = entries.filter((e) => !linkMap.has(e.id));
    }
    if (linkedOnly) {
      entries = entries.filter((e) => linkMap.has(e.id));
    }

    const mediaEntries = entries.filter((e) => e.type !== "folder");
    if (sort === "size") {
      entries = [...entries].sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
    } else if (sort === "name") {
      entries = [...entries].sort((a, b) => a.name.localeCompare(b.name, "fa"));
    }

    const enriched = entries.map((e) => ({
      ...e,
      linked: linkMap.get(e.id) || null,
    }));

    const breadcrumbs: { id: number | null; name: string }[] = [{ id: null, name: "Files.ir" }];
    if (store.rootFolderId) breadcrumbs.push({ id: store.rootFolderId, name: "Liobiz" });
    if (parentIdParam && parentIdParam !== "all") {
      const pid = Number(parentIdParam);
      const sectionFolder = Object.entries(store.sectionFolderIds).find(([, id]) => id === pid);
      if (sectionFolder) {
        breadcrumbs.push({ id: pid, name: sectionFolder[0] });
      }
      const cat = store.categories.find((c) => c.folderId === pid);
      if (cat) breadcrumbs.push({ id: pid, name: cat.name });
    }

    const stats = {
      total: mediaEntriesForStats.length,
      linked: mediaEntriesForStats.filter((e) => linkMap.has(e.id)).length,
      free: mediaEntriesForStats.filter((e) => !linkMap.has(e.id)).length,
    };

    if (flat || scope === "liobiz") {
      setEntriesCache(cacheKey, { entries, breadcrumbs, stats });
    }

    return NextResponse.json({
      ok: true,
      entries: enriched,
      breadcrumbs,
      rootFolderId: store.rootFolderId ?? null,
      sectionFolderIds: store.sectionFolderIds,
      stats,
    });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
