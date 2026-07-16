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

export function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|webm)(\?|$)/i.test(url));
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
  return {
    ...item,
    mediaKind: item.mediaKind ?? (isVideoUrl(item.videoSrc) ? "video" : "image"),
    aspectRatio: item.aspectRatio ?? "portrait",
    videoSrc: item.videoSrc?.trim() || undefined,
  };
}
