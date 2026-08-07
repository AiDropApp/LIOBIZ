import type { LandingContent } from "@/lib/cms-defaults";
import type { SiteContent } from "@/lib/content-store";

const ALLOWED_ROOTS = new Set([
  "landing",
  "pages",
  "site",
  "theme",
  "faq",
  "plans",
  "testimonials",
  "partners",
  "teamStats",
  "footerQuickLinks",
  "footerServiceLinks",
  "servicePages",
  "creativePartners",
  "portfolio",
  "backstage",
  "blogPosts",
  "redirects",
]);

export function isAllowedCmsPath(path: string): boolean {
  const root = path.split(".")[0];
  if (!ALLOWED_ROOTS.has(root)) return false;
  if (path.includes("__proto__") || path.includes("constructor")) return false;
  return true;
}

function splitPath(path: string): string[] {
  return path.split(".").filter(Boolean);
}

export function getByPath(content: SiteContent, path: string): unknown {
  const parts = splitPath(path);
  let cur: unknown = content;
  for (const key of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function setByPath(content: SiteContent, path: string, value: unknown): SiteContent {
  const parts = splitPath(path);
  if (parts.length === 0) return content;

  const clone = structuredClone(content);
  let cur: Record<string, unknown> = clone as unknown as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cur[key];
    if (next == null || typeof next !== "object") {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }

  cur[parts[parts.length - 1]] = value;
  return clone;
}

export function getLandingField(content: SiteContent, key: keyof LandingContent): string {
  const v = content.landing[key];
  return typeof v === "string" ? v : String(v ?? "");
}
