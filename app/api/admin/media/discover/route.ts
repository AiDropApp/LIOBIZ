import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { ensureFolder, findLiobizRootFolder, listFileEntries } from "@/lib/filesir/client";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { pruneCategoriesMissingOnMyFile } from "@/lib/media-center/category-sync";
import { clearEntriesCache } from "@/lib/media-center/entries-cache";
import { pruneCardsMissingOnMyFile } from "@/lib/media-center/sync-prune";
import { readMediaCenterStore, saveBootstrap, slugify, upsertCategory } from "@/lib/media-center/store";

export const runtime = "nodejs";

const SECTION_FOLDER_NAMES = new Set(MEDIA_SECTIONS.map((s) => s.folderName));

async function importFolderTree(
  section: MediaSection,
  folderId: number,
  parentCategoryId: string | null,
  validFolderIds: Set<number>,
  imported: string[],
) {
  validFolderIds.add(folderId);
  const children = await listFileEntries({ parentIds: [folderId], type: "folder", perPage: 100 });

  for (const child of children) {
    validFolderIds.add(child.id);
    const current = await readMediaCenterStore();
    let category = current.categories.find((c) => c.section === section && c.folderId === child.id);

    if (!category) {
      const siblings = current.categories.filter(
        (c) => c.section === section && (c.parentId ?? null) === parentCategoryId,
      );
      await upsertCategory({
        section,
        name: child.name,
        slug: slugify(child.name),
        folderId: child.id,
        parentId: parentCategoryId,
        sortOrder: siblings.length,
      });
      const refreshed = await readMediaCenterStore();
      category = refreshed.categories.find((c) => c.section === section && c.folderId === child.id);
      if (category) imported.push(`${section}/${categoryPathLabel(refreshed.categories, category.id)}`);
    } else {
      const updates: Parameters<typeof upsertCategory>[0] = {
        id: category.id,
        section,
        name: child.name,
        slug: slugify(child.name),
        folderId: category.folderId,
        parentId: parentCategoryId,
        sortOrder: category.sortOrder,
      };
      if ((category.parentId ?? null) !== parentCategoryId || category.name !== child.name) {
        await upsertCategory(updates);
        if (category.name !== child.name) {
          imported.push(`${section}/${child.name} (تغییر نام)`);
        }
      }
    }

    if (category) {
      await importFolderTree(section, child.id, category.id, validFolderIds, imported);
    }
  }
}

function categoryPathLabel(categories: { id: string; name: string; parentId?: string | null }[], id: string) {
  const parts: string[] = [];
  let current = categories.find((c) => c.id === id);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
  }
  return parts.join(" / ");
}

/** Scan Files.ir drive: import new folders, sync renames, remove categories deleted on MyFile. */
export async function POST() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  try {
    const store = await readMediaCenterStore();
    let root = store.rootFolderId ? { id: store.rootFolderId } : null;
    if (!root) {
      const found = await findLiobizRootFolder();
      if (found) root = { id: found.id };
      else root = { id: (await ensureFolder("Liobiz", null)).id };
    }

    const validFolderIds = new Set<number>([root.id]);
    const sectionFolderIds: Partial<Record<MediaSection, number>> = { ...store.sectionFolderIds };
    const importedCategories: string[] = [];

    for (const section of MEDIA_SECTIONS) {
      const sectionFolder = await ensureFolder(section.folderName, root.id);
      sectionFolderIds[section.id as MediaSection] = sectionFolder.id;
      validFolderIds.add(sectionFolder.id);
      await importFolderTree(section.id as MediaSection, sectionFolder.id, null, validFolderIds, importedCategories);
    }

    const rootChildren = await listFileEntries({ parentIds: [root.id], perPage: 100 });
    for (const child of rootChildren) {
      if (child.type !== "folder") continue;
      if (SECTION_FOLDER_NAMES.has(child.name)) continue;
      validFolderIds.add(child.id);
      const current = await readMediaCenterStore();
      let category = current.categories.find((c) => c.folderId === child.id);
      if (!category) {
        await upsertCategory({
          section: "portfolio",
          name: child.name,
          slug: slugify(child.name),
          folderId: child.id,
          parentId: null,
          sortOrder: current.categories.filter((c) => c.section === "portfolio").length,
        });
        const refreshed = await readMediaCenterStore();
        category = refreshed.categories.find((c) => c.folderId === child.id);
        if (category) importedCategories.push(`نمونه کار/${child.name}`);
      } else if (category.name !== child.name) {
        await upsertCategory({
          id: category.id,
          section: category.section,
          name: child.name,
          slug: slugify(child.name),
          folderId: category.folderId,
          parentId: category.parentId ?? null,
          sortOrder: category.sortOrder,
        });
        importedCategories.push(`نمونه کار/${child.name} (تغییر نام)`);
      }
      if (category) {
        await importFolderTree("portfolio", child.id, category.id, validFolderIds, importedCategories);
      }
    }

    const { removedLabels } = await pruneCategoriesMissingOnMyFile(validFolderIds);
    const { removedTitles: removedCardTitles } = await pruneCardsMissingOnMyFile();

    clearEntriesCache();

    const refreshed = await readMediaCenterStore();
    refreshed.rootFolderId = root.id;
    refreshed.sectionFolderIds = sectionFolderIds;
    await saveBootstrap(refreshed);

    const allMedia = await listFileEntries({ perPage: 100 });
    const mediaFiles = allMedia.filter((e) => e.type !== "folder");

    const parts: string[] = [];
    if (importedCategories.length > 0) {
      parts.push(`${importedCategories.length} دسته/زیردسته از MyFile به سایت اضافه یا بروز شد`);
    }
    if (removedLabels.length > 0) {
      parts.push(`${removedLabels.length} دسته از سایت حذف شد (پوشه در MyFile نبود)`);
    }

    if (removedCardTitles.length > 0) {
      parts.push(`${removedCardTitles.length} کارت از سایت حذف شد (فایل MyFile نبود)`);
    }

    return NextResponse.json({
      ok: true,
      store: refreshed,
      stats: {
        totalEntriesSampled: allMedia.length,
        mediaFilesSampled: mediaFiles.length,
        importedCategories,
        removedCategories: removedLabels,
        removedCards: removedCardTitles,
      },
      message: parts.length > 0 ? parts.join("؛ ") + "." : "ساختار Liobiz با MyFile همگام است.",
    });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
