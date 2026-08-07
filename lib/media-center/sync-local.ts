import type { MediaCard, MediaCategory, MediaSection } from "@/lib/filesir/types";
import { MEDIA_SECTIONS } from "@/lib/filesir/types";
import { resolveCategoryIdFromLocalPath } from "@/lib/media-center/category-path-utils";
import { listSectionDiskFolders } from "@/lib/media-center/local-categories";
import { newId, readMediaCenterStore, slugify, writeMediaCenterStore } from "@/lib/media-center/store";
import { cleanLabel, isCorruptedLabel } from "@/lib/text-sanitize";
export type LocalSyncResult = {
  categoriesAdded: number;
  categoriesUpdated: number;
  cardsLinked: number;
  sections: Record<string, { mains: number; subs: number }>;
};

function getAssetLocalPath(card: MediaCard): string | null {
  for (const field of ["cover", "video", "image", "avatar"] as const) {
    const asset = card[field];
    if (asset?.localPath) return asset.localPath.replace(/\\/g, "/");
  }
  return null;
}

function findCategory(
  categories: MediaCategory[],
  section: MediaSection,
  name: string,
  parentId: string | null,
): MediaCategory | undefined {
  const key = cleanLabel(name).normalize("NFC");
  return categories.find((c) => {
    if (c.section !== section) return false;
    if ((c.parentId ?? null) !== parentId) return false;
    if (isCorruptedLabel(c.name)) return false;
    return cleanLabel(c.name).normalize("NFC") === key;
  });
}

function upsertCategoryInStore(
  categories: MediaCategory[],
  input: {
    section: MediaSection;
    name: string;
    parentId: string | null;
    folderId?: number;
  },
): { categories: MediaCategory[]; cat: MediaCategory; added: boolean; skipped?: boolean } {
  const name = cleanLabel(input.name);
  if (!name || isCorruptedLabel(name)) {
    return { categories, cat: input.parentId ? categories.find(c => c.id === input.parentId)! : categories[0]!, added: false, skipped: true };
  }

  const existing = findCategory(categories, input.section, name, input.parentId);
  if (existing) {
    return { categories, cat: existing, added: false };
  }

  const siblings = categories.filter(
    (c) => c.section === input.section && (c.parentId ?? null) === input.parentId,
  );
  const cat: MediaCategory = {
    id: newId("cat"),
    createdAt: new Date().toISOString(),
    section: input.section,
    name,
    slug: slugify(name),
    folderId: input.folderId ?? 0,
    parentId: input.parentId,
    sortOrder: siblings.length,
  };
  return { categories: [...categories, cat], cat, added: true };
}

/**
 * Sync categories from on-disk folder structure and link cards to categories via localPath.
 * Does NOT delete files, cards, or existing category/card metadata.
 */
export async function syncLocalMediaCenter(): Promise<LocalSyncResult> {
  const store = await readMediaCenterStore();
  let categoriesAdded = 0;
  let categoriesUpdated = 0;
  let cardsLinked = 0;
  const sections: LocalSyncResult["sections"] = {};

  store.storageMode = "local";

  for (const sec of MEDIA_SECTIONS.filter((s) => s.id !== "blog")) {
    const section = sec.id;
    const diskFolders = await listSectionDiskFolders(section);
    sections[section] = { mains: 0, subs: 0 };

    for (const { main, subs } of diskFolders) {
      const mainResult = upsertCategoryInStore(store.categories, {
        section,
        name: main,
        parentId: null,
      });
      if (mainResult.skipped) continue;
      store.categories = mainResult.categories;
      if (mainResult.added) {
        categoriesAdded += 1;
        sections[section].mains += 1;
      }

      if (subs.length === 0) continue;

      for (const sub of subs) {
        const subResult = upsertCategoryInStore(store.categories, {
          section,
          name: sub,
          parentId: mainResult.cat.id,
        });
        if (subResult.skipped) continue;
        store.categories = subResult.categories;
        if (subResult.added) {
          categoriesAdded += 1;
          sections[section].subs += 1;
        }
      }
    }
  }

  // Link cards to categories based on localPath (never overwrite title/description/caption)
  for (const card of store.cards) {
    const localPath = getAssetLocalPath(card);
    if (!localPath) continue;

    const resolved = resolveCategoryIdFromLocalPath(store.categories, card.section, localPath);
    if (!resolved || card.categoryId === resolved) continue;

    card.categoryId = resolved;
    cardsLinked += 1;
    categoriesUpdated += 1;
  }

  await writeMediaCenterStore(store);

  return { categoriesAdded, categoriesUpdated, cardsLinked, sections };
}

export {
  filterVisibleRootCategories,
  filterVisibleSubCategories,
} from "@/lib/media-center/category-path-utils";