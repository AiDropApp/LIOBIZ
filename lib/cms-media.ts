export type MediaAspect = "portrait" | "landscape" | "square";
export type MediaKind = "image" | "video";

export type CmsMediaFields = {
  image: string;
  videoSrc?: string;
  mediaKind?: MediaKind;
  aspectRatio?: MediaAspect;
};

export const MEDIA_ASPECT_OPTIONS: { value: MediaAspect; label: string }[] = [
  { value: "portrait", label: "عمودی (۴:۵)" },
  { value: "landscape", label: "افقی (۱۶:۹)" },
  { value: "square", label: "مربعی (۱:۱)" },
];

export function normalizeMediaKind(item: Partial<CmsMediaFields>): MediaKind {
  const src = item.videoSrc?.trim();
  if (item.mediaKind === "video" && src) return "video";
  if (src && /\.(mp4|webm|mov)(\?|$)/i.test(src)) return "video";
  return "image";
}

export function aspectRatioClass(ratio?: MediaAspect): string {
  switch (ratio) {
    case "landscape":
      return "aspect-video";
    case "square":
      return "aspect-square";
    default:
      return "aspect-[4/5]";
  }
}

export function withMediaDefaults<T extends Partial<CmsMediaFields>>(item: T): T & {
  mediaKind: MediaKind;
  aspectRatio: MediaAspect;
} {
  return {
    ...item,
    mediaKind: item.mediaKind ?? normalizeMediaKind(item),
    aspectRatio: item.aspectRatio ?? "portrait",
  };
}

export function hasDisplayMedia(item: Partial<CmsMediaFields>): boolean {
  return Boolean(item.image?.trim() || item.videoSrc?.trim());
}
