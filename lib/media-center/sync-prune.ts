import { isFilesIrConfigured } from "@/lib/filesir/config";
import { deleteEntries } from "@/lib/filesir/client";
import type { MediaCard, MediaCenterStore } from "@/lib/filesir/types";
import { collectCardEntryIds } from "@/lib/media-center/asset-utils";
import { listLiobizMediaFlat } from "@/lib/media-center/library-entries";
import { readMediaCenterStore, writeMediaCenterStore } from "@/lib/media-center/store";

const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPublicPruneAt = 0;

/** Cards referencing at least one MyFile entry that no longer exists. */
export function findCardsWithMissingMyFileEntries(
  cards: MediaCard[],
  validEntryIds: Set<number>,
): MediaCard[] {
  return cards.filter((card) => {
    const entryIds = collectCardEntryIds(card);
    if (!entryIds.length) return false;
    return entryIds.some((id) => !validEntryIds.has(id));
  });
}

export async function collectLiobizEntryIds(store: MediaCenterStore): Promise<Set<number>> {
  if (!store.rootFolderId) return new Set();
  const flat = await listLiobizMediaFlat(store);
  return new Set(flat.map((e) => e.id));
}

/** Remove site cards whose MyFile files were deleted externally. */
export async function pruneCardsMissingOnMyFile(): Promise<{
  removedTitles: string[];
  store: MediaCenterStore;
}> {
  const store = await readMediaCenterStore();
  if (!store.rootFolderId) return { removedTitles: [], store };

  const validEntryIds = await collectLiobizEntryIds(store);
  const orphanCards = findCardsWithMissingMyFileEntries(store.cards, validEntryIds);
  if (!orphanCards.length) return { removedTitles: [], store };

  const removeIds = new Set(orphanCards.map((c) => c.id));
  const removedTitles = orphanCards.map((c) => c.title);
  store.cards = store.cards.filter((c) => !removeIds.has(c.id));
  await writeMediaCenterStore(store);
  return { removedTitles, store };
}

/** Rate-limited prune for public pages (avoids hammering MyFile API). */
export async function maybePruneCardsFromMyFile(force = false): Promise<string[]> {
  if (!isFilesIrConfigured()) return [];
  if (!force && Date.now() - lastPublicPruneAt < PRUNE_INTERVAL_MS) return [];
  try {
    const { removedTitles } = await pruneCardsMissingOnMyFile();
    lastPublicPruneAt = Date.now();
    return removedTitles;
  } catch {
    return [];
  }
}

export async function deleteCardsLinkedToEntryIds(entryIds: number[]): Promise<{
  removedTitles: string[];
  store: MediaCenterStore;
}> {
  const wanted = new Set(entryIds.filter(Boolean));
  if (!wanted.size) return { removedTitles: [], store: await readMediaCenterStore() };

  const store = await readMediaCenterStore();
  const orphanCards = store.cards.filter((card) =>
    collectCardEntryIds(card).some((id) => wanted.has(id)),
  );
  if (!orphanCards.length) return { removedTitles: [], store };

  const removeIds = new Set(orphanCards.map((c) => c.id));
  const removedTitles = orphanCards.map((c) => c.title);
  store.cards = store.cards.filter((c) => !removeIds.has(c.id));
  await writeMediaCenterStore(store);
  return { removedTitles, store };
}

export async function deleteCardAssetsFromMyFile(card: MediaCard): Promise<void> {
  const entryIds = [...new Set(collectCardEntryIds(card))];
  if (!entryIds.length) return;
  try {
    await deleteEntries(entryIds, true);
  } catch {
    /* entries may already be gone */
  }
}
