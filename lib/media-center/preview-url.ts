import type { MediaAssetRef, MediaCard } from "@/lib/filesir/types";
import { publicMediaUrl } from "@/lib/media-center/local-url";

export function adminAssetPreviewUrl(
  ref?: MediaAssetRef | null,
  opts?: { thumb?: boolean; video?: boolean },
): string | null {
  if (ref?.localPath) {
    return publicMediaUrl(ref.localPath);
  }
  if (!ref?.entryId) return null;
  const thumb = opts?.thumb !== false && (opts?.video || ref.kind !== "video" || opts?.thumb === true);
  const qs = thumb ? "?thumb=1" : "";
  return `/api/admin/media/preview/${ref.entryId}${qs}`;
}

export function adminVideoPreviewUrl(ref?: MediaAssetRef | null): string | null {
  if (ref?.localPath && ref.kind === "video") {
    return publicMediaUrl(ref.localPath);
  }
  if (!ref?.entryId || ref.kind !== "video") return null;
  return `/api/admin/media/preview/${ref.entryId}`;
}

export function getCardCoverRef(card: MediaCard): MediaAssetRef | null {
  if (card.section === "backstage") {
    return card.image?.entryId && card.image.kind !== "video" ? card.image : null;
  }
  if (card.section === "creative-partners") {
    return card.avatar?.entryId && card.avatar.kind !== "video" ? card.avatar : null;
  }
  return card.cover || card.image || card.avatar || null;
}

export function getCardVideoRef(card: MediaCard): MediaAssetRef | null {
  if (card.video?.kind === "video") return card.video;
  if (card.section === "creative-partners" && card.avatar?.kind === "video") return card.avatar;
  return null;
}
