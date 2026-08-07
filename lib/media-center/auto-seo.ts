/** Internal marker left by one-off SEO batch scripts — not user-facing caption text. */
export function isAutoSeoCaption(caption?: string | null): boolean {
  return Boolean(caption?.startsWith("auto-seo-batch"));
}

/** Strip batch markers so admin edits are not treated as auto-generated content. */
export function clearAutoSeoCaption(caption?: string | null): string {
  if (!caption || isAutoSeoCaption(caption)) return "";
  return caption;
}
