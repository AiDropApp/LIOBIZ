import { stripInlineStylesFromHtml } from "@/lib/cms-html";

/** Recursively strip inline style attributes from CMS JSON strings. */
export function stripInlineStylesDeep<T>(value: T): T {
  if (typeof value === "string") {
    return (value.includes("style=") ? stripInlineStylesFromHtml(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripInlineStylesDeep(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = stripInlineStylesDeep(nested);
    }
    return out as T;
  }
  return value;
}
