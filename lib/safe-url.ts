/** Allow same-origin paths and safe http(s)/mailto/tel links only. */
export function sanitizePublicUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
    if (parsed.protocol === "mailto:" || parsed.protocol === "tel:") return trimmed;
  } catch {
    /* invalid absolute URL */
  }

  return "";
}

export function isSafePublicUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  return sanitizePublicUrl(trimmed) === trimmed;
}
