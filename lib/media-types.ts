export type MediaAspect = "portrait" | "landscape" | "square";
export type MediaKind = "image" | "video";

export type CmsMediaFields = {
  mediaKind?: MediaKind;
  videoSrc?: string;
  aspectRatio?: MediaAspect;
};

export const MEDIA_ASPECT_OPTIONS: { value: MediaAspect; label: string }[] = [
  { value: "portrait", label: "عمودی (۴:۵)" },
  { value: "landscape", label: "افقی (۱۶:۹)" },
  { value: "square", label: "مربعی (۱:۱)" },
];

export const MEDIA_KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: "image", label: "تصویر" },
  { value: "video", label: "ویدیو" },
];

export function extractGoogleDriveFileId(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?[^#]*id=([^&]+)/i,
    /drive\.google\.com\/uc\?[^#]*id=([^&]+)/i,
    /docs\.google\.com\/uc\?[^#]*id=([^&]+)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export function isGoogleDriveUrl(url?: string) {
  return Boolean(extractGoogleDriveFileId(url));
}

/** Playable / embeddable URL for Drive share links and direct video files. */
export function toPlayableVideoUrl(url: string): string {
  const id = extractGoogleDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return url;
}

/** Lightweight thumbnail for Google Drive files (admin list previews). */
export function toGoogleDriveThumbnailUrl(url: string, size = 240): string | null {
  const id = extractGoogleDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

export function isVideoUrl(url?: string) {
  if (!url) return false;
  if (isGoogleDriveUrl(url)) return true;
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function resolveMediaKind(item: {
  mediaKind?: MediaKind;
  videoSrc?: string;
}): MediaKind {
  if (item.mediaKind === "video" && item.videoSrc?.trim()) return "video";
  if (item.mediaKind !== "image" && isVideoUrl(item.videoSrc)) return "video";
  return "image";
}

export function aspectRatioClass(ratio?: MediaAspect): string {
  switch (ratio) {
    case "landscape":
      return "cms-aspect-landscape";
    case "square":
      return "cms-aspect-square";
    default:
      return "cms-aspect-portrait";
  }
}

export function normalizeMediaFields<T extends CmsMediaFields>(item: T): T {
  const videoSrc = item.videoSrc?.trim() || undefined;
  return {
    ...item,
    mediaKind: item.mediaKind ?? (isVideoUrl(videoSrc) ? "video" : "image"),
    aspectRatio: item.aspectRatio ?? "portrait",
    videoSrc,
  };
}
