import DOMPurify from "isomorphic-dompurify";
import { sanitizePublicUrl } from "@/lib/safe-url";

const PURIFY_OPTS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "span",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "dir"],
};

let hooksRegistered = false;

function registerSanitizeHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "href") {
      data.attrValue = sanitizePublicUrl(data.attrValue);
    }
  });
}

export function isHtmlContent(value?: string | null): boolean {
  const text = value?.trim() || "";
  if (!text) return false;
  return /^<[a-z][\s\S]*>/i.test(text);
}

export function sanitizeCmsHtml(html: string): string {
  registerSanitizeHooks();
  return DOMPurify.sanitize(html, PURIFY_OPTS);
}

/** Strip inline style attributes (SEO audits flag these; colors come from CSS classes). */
export function stripInlineStylesFromHtml(html: string): string {
  if (!html.includes("style=")) return html;
  return html.replace(/\sstyle="[^"]*"/gi, "").replace(/\sstyle='[^']*'/gi, "");
}

export function plainToHtmlParagraph(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isHtmlContent(trimmed)) return sanitizeCmsHtml(trimmed);
  return sanitizeCmsHtml(`<p>${escapeHtml(trimmed).replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
