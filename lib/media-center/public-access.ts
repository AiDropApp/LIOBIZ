import type { MediaAssetRef, MediaCard } from "@/lib/filesir/types";
import { readSiteContent } from "@/lib/content-store";
import { readMediaCenterStore } from "@/lib/media-center/store";

const FILESIR_ENTRY_RE = /\/api\/media\/filesir\/(\d+)/g;

function cardAssets(card: MediaCard): (MediaAssetRef | null | undefined)[] {
  return [card.cover, card.image, card.avatar, card.video];
}

function extractFilesIrEntryIds(text?: string | null): number[] {
  if (!text) return [];
  const ids: number[] = [];
  for (const match of text.matchAll(FILESIR_ENTRY_RE)) {
    const id = Number(match[1]);
    if (id) ids.push(id);
  }
  return ids;
}

export async function isPublicFilesIrEntry(entryId: number): Promise<boolean> {
  if (!entryId) return false;

  const store = await readMediaCenterStore();
  const inMediaCenter = store.cards.some(
    (card) =>
      card.published && cardAssets(card).some((asset) => asset?.entryId === entryId),
  );
  if (inMediaCenter) return true;

  const content = await readSiteContent();
  for (const post of content.blogPosts) {
    if (!post.published) continue;
    const ids = [
      ...extractFilesIrEntryIds(post.coverImage),
      ...extractFilesIrEntryIds(post.content),
    ];
    if (ids.includes(entryId)) return true;
  }

  return false;
}
