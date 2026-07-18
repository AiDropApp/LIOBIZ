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

const DIRECT_VIDEO_EXT =
  /\.(mp4|webm|mov|m4v|ogg|ogv|mkv|m3u8|avi|3gp|ts)(\?|$)/i;

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

/** my.files.ir / files.ir share or folder pages (HTML, not a raw video file). */
export function isFilesIrUrl(url?: string) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "my.files.ir" || host === "files.ir" || host.endsWith(".files.ir");
  } catch {
    return /(?:^|\/\/)(?:my\.)?files\.ir\//i.test(url);
  }
}

export function isDirectVideoFileUrl(url?: string) {
  if (!url) return false;
  return DIRECT_VIDEO_EXT.test(url);
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") || u.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function aparatEmbedUrl(url: string): string | null {
  const match = url.match(/aparat\.com\/v\/([^/?#]+)/i);
  return match?.[1] ? `https://www.aparat.com/video/video/embed/videohash/${match[1]}/vt/frame` : null;
}

function vimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
}

/**
 * Share / watch pages cannot be used as `<video src>`.
 * Embed them in an iframe (Drive preview, Files.ir share, YouTube, …).
 */
export function needsIframeVideoEmbed(url?: string): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/media") || trimmed.startsWith("/uploads") || trimmed.startsWith("blob:")) {
    return false;
  }
  if (isDirectVideoFileUrl(trimmed)) return false;
  if (isGoogleDriveUrl(trimmed) || isFilesIrUrl(trimmed)) return true;
  if (youtubeEmbedUrl(trimmed) || aparatEmbedUrl(trimmed) || vimeoEmbedUrl(trimmed)) return true;
  // Any other remote URL without a video file extension is almost certainly a host page.
  return /^https?:\/\//i.test(trimmed);
}

/** Playable / embeddable URL for Drive, Files.ir, YouTube, and direct video files. */
export function toPlayableVideoUrl(url: string): string {
  const id = extractGoogleDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;

  const yt = youtubeEmbedUrl(url);
  if (yt) return yt;
  const aparat = aparatEmbedUrl(url);
  if (aparat) return aparat;
  const vimeo = vimeoEmbedUrl(url);
  if (vimeo) return vimeo;

  // Files.ir share/folder pages: keep the page URL for iframe embed.
  if (isFilesIrUrl(url)) return url.trim();

  return url.trim();
}

/** Lightweight thumbnail for Google Drive files (admin list previews). */
export function toGoogleDriveThumbnailUrl(url: string, size = 240): string | null {
  const id = extractGoogleDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

export function isVideoUrl(url?: string) {
  if (!url) return false;
  if (isGoogleDriveUrl(url) || isFilesIrUrl(url)) return true;
  if (youtubeEmbedUrl(url) || aparatEmbedUrl(url) || vimeoEmbedUrl(url)) return true;
  return isDirectVideoFileUrl(url);
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
