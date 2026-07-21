import type { MediaAssetRef, MediaCard } from "@/lib/filesir/types";

const ASSET_FIELDS = ["cover", "video", "image", "avatar"] as const;

export type EntryLinkInfo = {
  cardId: string;
  cardTitle: string;
  field: string;
  section: string;
};

export function collectCardEntryIds(card: MediaCard): number[] {
  const ids: number[] = [];
  for (const field of ASSET_FIELDS) {
    const asset = card[field as keyof MediaCard] as MediaAssetRef | null | undefined;
    if (asset?.entryId) ids.push(asset.entryId);
  }
  return ids;
}

export function buildEntryLinkMap(cards: MediaCard[]): Map<number, EntryLinkInfo> {
  const map = new Map<number, EntryLinkInfo>();
  for (const card of cards) {
    for (const field of ASSET_FIELDS) {
      const asset = card[field as keyof MediaCard] as MediaAssetRef | null | undefined;
      if (asset?.entryId) {
        map.set(asset.entryId, {
          cardId: card.id,
          cardTitle: card.title,
          field,
          section: card.section,
        });
      }
    }
  }
  return map;
}

export function getPrimaryAsset(card: MediaCard): MediaAssetRef | null {
  return card.cover || card.image || card.avatar || card.video || null;
}

export function getPrimaryAssetField(card: MediaCard): (typeof ASSET_FIELDS)[number] | null {
  if (card.cover) return "cover";
  if (card.image) return "image";
  if (card.avatar) return "avatar";
  if (card.video) return "video";
  return null;
}
