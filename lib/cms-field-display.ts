import { isHtmlContent, sanitizeCmsHtml } from "@/lib/cms-html";

export function inlineHtmlForSemanticTag(html: string): string {
  const sanitized = sanitizeCmsHtml(html);
  const singleParagraph = sanitized.match(/^<p[^>]*>([\s\S]*)<\/p>$/i);
  return singleParagraph ? singleParagraph[1] : sanitized;
}

export function plainTextFromCmsValue(value: string): string {
  if (!value.trim()) return "";
  if (!isHtmlContent(value)) return value;
  const stripped = inlineHtmlForSemanticTag(value).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  return stripped.trim();
}
