import { promises as fs } from "fs";
import path from "path";
import type { MediaCard, MediaCategory, MediaSection } from "@/lib/filesir/types";
import { MEDIA_SECTIONS } from "@/lib/filesir/types";
import {
  indexBasenamesFromCards,
  indexBasenamesFromMap,
  sectionFromLocalPath,
  translateDiskPath,
} from "@/lib/media-center/canonical-paths";
import type { FilesIrLocalMap } from "@/lib/media-center/local-map";
import { isCorruptedLabel } from "@/lib/text-sanitize";

const SKIP_DIR_NAMES = new Set([".thumbs", "backup", "uploads", "node_modules"]);

export type FolderRename = {
  fromRel: string;
  toRel: string;
  section: MediaSection | null;
};

export type FolderRenamePlan = {
  renames: FolderRename[];
  conflicts: string[];
  aliasesBySection: Map<MediaSection, Map<string, string>>;
  globalAliases: Map<string, string>;
};

export async function walkMediaRelativePaths(mediaRoot: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dirAbs: string, baseRel = ""): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dirAbs, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name.toLowerCase())) continue;
        out.push(rel.replace(/\\/g, "/"));
        await walk(path.join(dirAbs, entry.name), rel);
      } else if (entry.isFile() && !entry.name.endsWith(".part")) {
        out.push(rel.replace(/\\/g, "/"));
      }
    }
  }

  await walk(mediaRoot);
  return out;
}

/** Learn mojibake→UTF-8 segment aliases by pairing on-disk paths with map/card canonical paths (same basename). */
export function buildSegmentAliasesFromPathPairs(
  pairs: { diskPath: string; canonicalPath: string }[],
): Map<string, string> {
  const votes = new Map<string, Map<string, number>>();

  for (const { diskPath, canonicalPath } of pairs) {
    const diskParts = diskPath.replace(/\\/g, "/").split("/").filter(Boolean);
    const canonParts = canonicalPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (diskParts.length !== canonParts.length) continue;

    for (let i = 0; i < diskParts.length; i += 1) {
      const from = diskParts[i];
      const to = canonParts[i];
      if (from === to) continue;
      if (!isCorruptedLabel(from) || isCorruptedLabel(to)) continue;

      if (!votes.has(from)) votes.set(from, new Map());
      const bucket = votes.get(from)!;
      bucket.set(to, (bucket.get(to) || 0) + 1);
    }
  }

  const aliases = new Map<string, string>();
  for (const [from, bucket] of votes) {
    const [best] = [...bucket.entries()].sort((a, b) => b[1] - a[1]);
    if (best) aliases.set(from, best[0]);
  }
  return aliases;
}

export async function buildFolderRenameAliases(opts: {
  categories: MediaCategory[];
  cards: MediaCard[];
  map: FilesIrLocalMap;
  diskFilePaths: string[];
}): Promise<Map<MediaSection, Map<string, string>>> {
  const byBasenameMap = indexBasenamesFromMap(opts.map);
  const byBasenameCard = indexBasenamesFromCards(opts.cards);
  const pairs: { diskPath: string; canonicalPath: string; section: MediaSection | null }[] = [];

  for (const diskPath of opts.diskFilePaths) {
    const base = path.basename(diskPath).toLowerCase();
    const canonical =
      byBasenameMap.get(base)?.localPath.replace(/\\/g, "/") ||
      byBasenameCard.get(base)?.replace(/\\/g, "/");
    if (!canonical || isCorruptedLabel(canonical)) continue;
    pairs.push({
      diskPath: diskPath.replace(/\\/g, "/"),
      canonicalPath: canonical,
      section: sectionFromLocalPath(diskPath),
    });
  }

  const aliasesBySection = new Map<MediaSection, Map<string, string>>();
  for (const { id: section } of MEDIA_SECTIONS) {
    const sectionPairs = pairs.filter((p) => p.section === section);
    aliasesBySection.set(section, buildSegmentAliasesFromPathPairs(sectionPairs));
  }

  return aliasesBySection;
}

export function mergeSectionAliases(
  aliasesBySection: Map<MediaSection, Map<string, string>>,
): Map<string, string> {
  const global = new Map<string, string>();
  for (const sectionMap of aliasesBySection.values()) {
    for (const [from, to] of sectionMap) {
      const prev = global.get(from);
      if (prev && prev !== to) {
        throw new Error(`تعارض نام پوشه: «${from}» → «${prev}» و «${to}»`);
      }
      global.set(from, to);
    }
  }
  return global;
}

/** Plan or apply folder segment renames under mediaRoot. */
export async function planAndApplyFolderRenames(
  mediaRoot: string,
  aliasesBySection: Map<MediaSection, Map<string, string>>,
  apply: boolean,
): Promise<FolderRenamePlan> {
  const renames: FolderRename[] = [];
  const conflicts: string[] = [];
  const globalAliases = mergeSectionAliases(aliasesBySection);

  async function walkDir(dirAbs: string, relFromRoot: string): Promise<void> {
    const normRel = relFromRoot.replace(/\\/g, "/");
    const section = sectionFromLocalPath(normRel);
    const aliases = section ? aliasesBySection.get(section) : undefined;

    let entries;
    try {
      entries = await fs.readdir(dirAbs, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIR_NAMES.has(entry.name.toLowerCase())) continue;

      const fromRel = normRel ? `${normRel}/${entry.name}` : entry.name;
      let childAbs = path.join(dirAbs, entry.name);
      let childRel = fromRel;

      const canonical = aliases?.get(entry.name);
      if (canonical && canonical !== entry.name) {
        const toRel = normRel ? `${normRel}/${canonical}` : canonical;
        const targetAbs = path.join(dirAbs, canonical);

        try {
          await fs.access(targetAbs);
          conflicts.push(`پوشه مقصد از قبل وجود دارد: ${toRel} (منبع: ${fromRel})`);
        } catch {
          renames.push({ fromRel, toRel, section: section ?? null });
          if (apply) {
            await fs.rename(childAbs, targetAbs);
            childAbs = targetAbs;
          }
          childRel = toRel;
        }
      }

      await walkDir(childAbs, childRel);
    }
  }

  await walkDir(mediaRoot, "");
  return { renames, conflicts, aliasesBySection, globalAliases };
}

export function translateStoredPath(storedPath: string, aliases: Map<string, string>): string {
  if (!storedPath?.trim()) return storedPath;
  return translateDiskPath(storedPath.replace(/\\/g, "/"), aliases);
}

export function patchLocalMapPaths(map: FilesIrLocalMap, aliases: Map<string, string>): number {
  let patched = 0;
  for (const entry of Object.values(map.entries)) {
    const nextPath = translateStoredPath(entry.localPath, aliases);
    const nextFolder = entry.folderPath ? translateStoredPath(entry.folderPath, aliases) : entry.folderPath;
    if (nextPath !== entry.localPath || nextFolder !== entry.folderPath) {
      entry.localPath = nextPath;
      if (nextFolder) entry.folderPath = nextFolder;
      patched += 1;
    }
  }
  return patched;
}

export function patchMediaCenterPaths(cards: MediaCard[], aliases: Map<string, string>): number {
  let patched = 0;
  for (const card of cards) {
    for (const field of ["cover", "video", "image", "avatar"] as const) {
      const asset = card[field];
      if (!asset?.localPath) continue;
      const next = translateStoredPath(asset.localPath, aliases);
      if (next !== asset.localPath) {
        asset.localPath = next;
        patched += 1;
      }
    }
  }
  return patched;
}

export async function countCorruptDiskFolders(mediaRoot: string): Promise<number> {
  const dirs = await walkMediaRelativePaths(mediaRoot);
  return dirs.filter((rel) => {
    const name = rel.split("/").pop() || rel;
    return isCorruptedLabel(name);
  }).length;
}
