/** Client-safe helpers (no Node fs). */

export function publicMediaUrl(localPath: string): string {
  const clean = localPath
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `/media/${clean}`;
}
