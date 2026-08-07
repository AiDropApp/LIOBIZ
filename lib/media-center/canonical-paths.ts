import type { MediaCard, MediaCategory, MediaSection } from "@/lib/filesir/types";
import { categoryPath } from "@/lib/media-center/categories";
import {
  categoryDiskRelPath,
  filterVisibleRootCategories,
  filterVisibleSubCategories,
  sectionFolderName,
  resolveCategoryIdFromLocalPath,
} from "@/lib/media-center/category-path-utils";
import type { FilesIrLocalMap, LocalMediaEntry } from "@/lib/media-center/local-map";
import { isCorruptedLabel } from "@/lib/text-sanitize";

const SECTION_LABELS: Record<MediaSection, string> = {
  portfolio: "نمونه کار",
  backstage: "پشت صحنه",
  "creative-partners": "همکاران خلاق",
  blog: "بلاگ",
};

export function sectionFromLocalPath(localPath: string): MediaSection | null {
  const first = localPath.replace(/\\/g, "/").split("/").filter(Boolean)[0];
  if (first === "portfolio" || first === "backstage" || first === "creative-partners" || first === "blog") {
    return first;
  }
  return null;
}

/** Basename -> canonical UTF-8 localPath from filesir-local-map.json */
export function indexBasenamesFromMap(map: FilesIrLocalMap): Map<string, LocalMediaEntry> {
  const out = new Map<string, LocalMediaEntry>();
  for (const meta of Object.values(map.entries)) {
    if (!meta?.fileName || !meta.localPath) continue;
    const key = meta.fileName.toLowerCase();
    if (!out.has(key)) out.set(key, meta);
  }
  return out;
}

/** Basename -> canonical UTF-8 localPath from media-center cards */
export function indexBasenamesFromCards(cards: MediaCard[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const card of cards) {
    for (const field of ["cover", "video", "image", "avatar"] as const) {
      const asset = card[field];
      const localPath = asset?.localPath?.replace(/\\/g, "/");
      const fileName = asset?.fileName?.trim();
      if (!localPath || !fileName) continue;
      const key = fileName.toLowerCase();
      if (!out.has(key)) out.set(key, localPath);
    }
  }
  return out;
}

function countByPrefix(paths: string[], prefix: string): number {
  const norm = prefix.replace(/\\/g, "/");
  return paths.filter((p) => p === norm || p.startsWith(`${norm}/`)).length;
}

function countCanonicalByCategory(
  canonicalPaths: string[],
  categories: MediaCategory[],
  categoryId: string,
): number {
  const rel = categoryDiskRelPath(categories, categoryId);
  if (!rel) return 0;
  return countByPrefix(canonicalPaths, rel);
}

/** Pair mojibake disk folder names with clean category names using file-count fingerprints. */
export function buildSegmentAliasMap(
  section: MediaSection,
  categories: MediaCategory[],
  diskFolders: { main: string; subs: string[] }[],
  diskFilePaths: string[],
  canonicalPaths: string[],
): Map<string, string> {
  const aliases = new Map<string, string>();
  const sectionDir = sectionFolderName(section);
  const roots = filterVisibleRootCategories(categories, section);
  const usedRoots = new Set<string>();

  const diskSorted = [...diskFolders].sort(
    (a, b) =>
      countByPrefix(diskFilePaths, `${sectionDir}/${a.main}`) -
      countByPrefix(diskFilePaths, `${sectionDir}/${b.main}`),
  );

  for (const diskMain of diskSorted) {
    const diskCount = countByPrefix(diskFilePaths, `${sectionDir}/${diskMain.main}`);
    const candidates = roots
      .filter((c) => !usedRoots.has(c.id))
      .map((c) => ({ c, count: countCanonicalByCategory(canonicalPaths, categories, c.id) }))
      .filter((x) => x.count === diskCount && diskCount > 0)
      .sort((a, b) => a.c.sortOrder - b.c.sortOrder || a.c.name.localeCompare(b.c.name, "fa"));

    const match = candidates[0]?.c ?? roots.find((c) => !usedRoots.has(c.id));
    if (!match) continue;

    usedRoots.add(match.id);
    if (diskMain.main !== match.name) aliases.set(diskMain.main, match.name);

    const subs = filterVisibleSubCategories(categories, section, match.id);
    const usedSubs = new Set<string>();
    const diskSubsSorted = [...diskMain.subs].sort(
      (a, b) =>
        countByPrefix(diskFilePaths, `${sectionDir}/${diskMain.main}/${a}`) -
        countByPrefix(diskFilePaths, `${sectionDir}/${diskMain.main}/${b}`),
    );

    for (const diskSub of diskSubsSorted) {
      const subDiskCount = countByPrefix(
        diskFilePaths,
        `${sectionDir}/${diskMain.main}/${diskSub}`,
      );
      const subCandidates = subs
        .filter((c) => !usedSubs.has(c.id))
        .map((c) => ({ c, count: countCanonicalByCategory(canonicalPaths, categories, c.id) }))
        .filter((x) => x.count === subDiskCount && subDiskCount > 0)
        .sort((a, b) => a.c.sortOrder - b.c.sortOrder || a.c.name.localeCompare(b.c.name, "fa"));

      const subMatch = subCandidates[0]?.c ?? subs.find((c) => !usedSubs.has(c.id));
      if (!subMatch) continue;
      usedSubs.add(subMatch.id);
      if (diskSub !== subMatch.name) aliases.set(diskSub, subMatch.name);
    }
  }

  return aliases;
}

export function translateDiskPath(diskPath: string, aliases: Map<string, string>): string {
  const parts = diskPath.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts.map((part) => aliases.get(part) ?? part).join("/");
}

export function resolveCanonicalLocalPath(opts: {
  diskPath: string;
  fileName: string;
  byBasenameMap: Map<string, LocalMediaEntry>;
  byBasenameCard: Map<string, string>;
  aliases: Map<string, string>;
}): string {
  const key = opts.fileName.toLowerCase();
  const fromMap = opts.byBasenameMap.get(key)?.localPath?.replace(/\\/g, "/");
  if (fromMap && !isCorruptedLabel(fromMap)) return fromMap;

  const fromCard = opts.byBasenameCard.get(key)?.replace(/\\/g, "/");
  if (fromCard && !isCorruptedLabel(fromCard)) return fromCard;

  const translated = translateDiskPath(opts.diskPath, opts.aliases);
  if (!isCorruptedLabel(translated)) return translated;

  return translated;
}

export function displayFolderLabel(categories: MediaCategory[], canonicalPath: string): string {
  const norm = canonicalPath.replace(/\\/g, "/");
  const section = sectionFromLocalPath(norm);

  if (!section) {
    const folder = norm.includes("/") ? norm.slice(0, norm.lastIndexOf("/")) : "";
    return folder || "ریشه";
  }

  if (!isCorruptedLabel(norm)) {
    const catId = resolveCategoryIdFromLocalPath(categories, section, norm);
    if (catId) return categoryPath(categories, catId);
  }

  const sectionDir = sectionFolderName(section);
  if (!norm.startsWith(`${sectionDir}/`)) {
    return SECTION_LABELS[section] || sectionDir;
  }

  const rest = norm.slice(sectionDir.length + 1);
  const folderPart = rest.includes("/") ? rest.slice(0, rest.lastIndexOf("/")) : rest;
  if (!folderPart) return SECTION_LABELS[section] || sectionDir;

  const segments = folderPart.split("/").filter(Boolean);
  const clean = segments.filter((s) => !isCorruptedLabel(s));
  if (clean.length === 0) return SECTION_LABELS[section] || sectionDir;
  return clean.join(" › ");
}

export { SECTION_LABELS };
