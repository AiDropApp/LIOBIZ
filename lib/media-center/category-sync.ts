import type { MediaCategory, MediaCenterStore } from "@/lib/filesir/types";
import { readMediaCenterStore, writeMediaCenterStore } from "@/lib/media-center/store";

/** Categories whose MyFile folder no longer exists (plus metadata children). */
export function collectOrphanCategoryIds(
  categories: MediaCategory[],
  validFolderIds: Set<number>,
): Set<string> {
  const direct = categories.filter((c) => c.folderId && !validFolderIds.has(c.folderId));
  const removeIds = new Set(direct.map((c) => c.id));

  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of categories) {
      if (cat.parentId && removeIds.has(cat.parentId) && !removeIds.has(cat.id)) {
        removeIds.add(cat.id);
        changed = true;
      }
    }
  }

  return removeIds;
}

export async function pruneCategoriesMissingOnMyFile(
  validFolderIds: Set<number>,
): Promise<{ removedLabels: string[]; store: MediaCenterStore }> {
  const store = await readMediaCenterStore();
  const removeIds = collectOrphanCategoryIds(store.categories, validFolderIds);
  if (removeIds.size === 0) return { removedLabels: [], store };

  const removedLabels = store.categories.filter((c) => removeIds.has(c.id)).map((c) => c.name);

  store.categories = store.categories.filter((c) => !removeIds.has(c.id));
  store.cards = store.cards.filter((c) => !c.categoryId || !removeIds.has(c.categoryId));

  await writeMediaCenterStore(store);
  return { removedLabels, store };
}
