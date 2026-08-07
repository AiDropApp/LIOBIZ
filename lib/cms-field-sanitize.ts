import { isHtmlContent, sanitizeCmsHtml } from "@/lib/cms-html";
import { sanitizePublicUrl } from "@/lib/safe-url";

function isUrlLikeFieldKey(key: string): boolean {
  return (
    key.includes("url") ||
    key.includes("href") ||
    key.includes("image") ||
    key === "src" ||
    key === "link"
  );
}

export function sanitizeFieldValue(path: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (isHtmlContent(value)) return sanitizeCmsHtml(value);

  const key = path.split(".").pop()?.toLowerCase() || "";
  if (isUrlLikeFieldKey(key)) return sanitizePublicUrl(value);
  return value;
}

/** @internal test alias */
export const sanitizeFieldValueForTest = sanitizeFieldValue;
