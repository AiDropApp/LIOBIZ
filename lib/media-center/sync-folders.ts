import { moveEntries, updateEntry } from "@/lib/filesir/client";
import type { MediaCard, MediaCenterStore, MediaSection } from "@/lib/filesir/types";
import { collectCardEntryIds, getPrimaryAsset } from "@/lib/media-center/asset-utils";

export function resolveTargetFolderId(card: MediaCard, store: MediaCenterStore): number | null {
  if (card.categoryId) {
    const cat = store.categories.find((c) => c.id === card.categoryId);
    if (cat?.folderId) return cat.folderId;
  }
  const sectionFolder = store.sectionFolderIds[card.section as MediaSection];
  return sectionFolder ?? null;
}

/** Move all card assets into the correct Files.ir folder after save. */
export async function syncCardAssetsToFolders(card: MediaCard, store: MediaCenterStore) {
  // Local-first mode: skip remote My Files moves (they refresh the whole library and are slow).
  if (process.env.MEDIA_LOCAL_FIRST === "1") return;

  const destinationId = resolveTargetFolderId(card, store);
  const entryIds = [...new Set(collectCardEntryIds(card))];
  if (!destinationId || entryIds.length === 0) return;

  await moveEntries(entryIds, destinationId);

  const primary = getPrimaryAsset(card);
  const description = card.description || card.caption || "";
  if (primary?.entryId && description) {
    await updateEntry(primary.entryId, { description }).catch(() => undefined);
  }
}
