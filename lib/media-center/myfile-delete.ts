import { deleteEntries, listFileEntries } from "@/lib/filesir/client";
import type { MediaCenterStore } from "@/lib/filesir/types";

/** Category ids removed when deleting a category subtree (includes root). */
export function collectCategorySubtreeIds(store: MediaCenterStore, rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of store.categories) {
      if (cat.parentId && ids.has(cat.parentId) && !ids.has(cat.id)) {
        ids.add(cat.id);
        changed = true;
      }
    }
  }
  return ids;
}

async function deleteFolderRecursive(folderId: number): Promise<void> {
  const children = await listFileEntries({ parentIds: [folderId], perPage: 200 });
  for (const child of children) {
    if (child.type === "folder") {
      await deleteFolderRecursive(child.id);
    }
  }
  const childIds = children.map((c) => c.id);
  if (childIds.length) {
    await deleteEntries(childIds, true);
  }
  await deleteEntries([folderId], true);
}

/** Delete MyFile folders for a category subtree (deepest folders first). */
export async function deleteCategoryFoldersFromMyFile(
  store: MediaCenterStore,
  rootCategoryId: string,
): Promise<number> {
  const removeIds = collectCategorySubtreeIds(store, rootCategoryId);
  const folders = store.categories
    .filter((c) => removeIds.has(c.id) && c.folderId)
    .sort((a, b) => {
      const depth = (id: string) => {
        let d = 0;
        let cur = store.categories.find((c) => c.id === id);
        while (cur?.parentId) {
          d += 1;
          cur = store.categories.find((c) => c.id === cur!.parentId);
        }
        return d;
      };
      return depth(b.id) - depth(a.id);
    });

  let deleted = 0;
  for (const cat of folders) {
    if (!cat.folderId) continue;
    try {
      await deleteFolderRecursive(cat.folderId);
      deleted += 1;
    } catch {
      /* folder may already be gone */
    }
  }
  return deleted;
}
