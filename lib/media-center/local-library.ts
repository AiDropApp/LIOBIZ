import { promises as fs } from "fs";
import path from "path";
import type { MediaCard, MediaCategory, MediaSection } from "@/lib/filesir/types";
import { fileMatchesCategoryPrefix } from "@/lib/media-center/category-path-utils";
import {
  buildSegmentAliasMap,
  displayFolderLabel,
  indexBasenamesFromCards,
  indexBasenamesFromMap,
  resolveCanonicalLocalPath,
  sectionFromLocalPath,
} from "@/lib/media-center/canonical-paths";
import { listSectionDiskFolders } from "@/lib/media-center/local-categories";
import { getMediaRootDir, readLocalMap, type LocalMediaEntry } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { getUploadsDir } from "@/lib/paths";

export type LocalLibraryEntry = {
  id: number;
  name: string;
  type: "image" | "video" | "folder" | string;
  mime?: string;
  file_size?: number;
  description?: string;
  folderId?: number;
  folderLabel?: string;
  folderPath: string;
  /** UTF-8 path for labels (disk path may use legacy mojibake folder names on Windows). */
  canonicalPath?: string;
  localPath: string;
  previewUrl: string;
};

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".mkv", ".m4v"]);

function kindFromName(name: string, hint?: LocalMediaEntry["kind"]): "image" | "video" | "other" {
  if (hint === "image" || hint === "video") return hint;
  const ext = path.extname(name).toLowerCase();
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return "other";
}

export function stableLocalEntryId(localPath: string): number {
  let hash = 0;
  for (let i = 0; i < localPath.length; i += 1) {
    hash = (hash * 31 + localPath.charCodeAt(i)) >>> 0;
  }
  return 1_000_000_000 + (hash % 900_000_000);
}

function sectionRoots(section: MediaSection): string[] {
  switch (section) {
    case "portfolio":
      return ["portfolio", "hero", "about", "uploads/portfolio", "uploads/hero", "uploads/about"];
    case "backstage":
      return ["backstage", "پروژه ها/backstage", "پروژهها/backstage", "uploads/backstage"];
    case "creative-partners":
      return [
        "creative-partners",
        "پروژه ها/creative-partners",
        "پروژهها/creative-partners",
        "uploads/creative-partners",
      ];
    case "blog":
      return ["blog"];
    default:
      return [section];
  }
}

type ScannedFile = { abs: string; rel: string; previewUrl: string };

function uploadsPreviewUrl(rel: string): string {
  const apiRel = rel.replace(/^uploads\//, "");
  return `/api/media/${apiRel.split("/").map(encodeURIComponent).join("/")}`;
}

async function collectLibraryFiles(): Promise<ScannedFile[]> {
  const mediaRoot = getMediaRootDir();
  const fromMedia: ScannedFile[] = (await walkFiles(mediaRoot)).map((file) => ({
    ...file,
    previewUrl: publicMediaUrl(file.rel),
  }));

  const uploadsRoot = getUploadsDir();
  const uploadFolders = ["portfolio", "backstage", "hero", "about", "creative-partners"] as const;
  const fromUploads: ScannedFile[] = [];
  for (const folder of uploadFolders) {
    const files = await walkFiles(path.join(uploadsRoot, folder), `uploads/${folder}`);
    for (const file of files) {
      fromUploads.push({
        abs: file.abs,
        rel: file.rel,
        previewUrl: uploadsPreviewUrl(file.rel),
      });
    }
  }

  return [...fromMedia, ...fromUploads];
}

function normalizeRel(rel: string): string {
  return rel.split(path.sep).join("/");
}

async function walkFiles(dir: string, baseRel = ""): Promise<{ abs: string; rel: string }[]> {
  const out: { abs: string; rel: string }[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = normalizeRel(baseRel ? `${baseRel}/${entry.name}` : entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(abs, rel)));
    } else if (entry.isFile() && !entry.name.endsWith(".part")) {
      out.push({ abs, rel });
    }
  }
  return out;
}

export async function hasLocalMediaFiles(): Promise<boolean> {
  try {
    const files = await collectLibraryFiles();
    return files.length > 0;
  } catch {
    return false;
  }
}

export async function listLocalMediaFlat(opts: {
  section?: MediaSection | null;
  query?: string;
  categoryPathPrefixes?: string[];
  categories?: MediaCategory[];
  cards?: MediaCard[];
}): Promise<LocalLibraryEntry[]> {
  const map = await readLocalMap();
  const byPath = new Map<string, { entryId: number; meta: LocalMediaEntry }>();
  for (const [id, meta] of Object.entries(map.entries)) {
    byPath.set(meta.localPath.replace(/^\/+/, ""), { entryId: Number(id), meta });
  }

  const byBasenameMap = indexBasenamesFromMap(map);
  const byBasenameCard = opts.cards ? indexBasenamesFromCards(opts.cards) : new Map<string, string>();
  const canonicalPaths = [
    ...Object.values(map.entries).map((e) => e.localPath.replace(/\\/g, "/")),
    ...byBasenameCard.values(),
  ];

  const aliasCache = new Map<MediaSection, Map<string, string>>();

  const all = await collectLibraryFiles();
  const roots = opts.section ? sectionRoots(opts.section) : null;
  const q = opts.query?.trim().toLowerCase();
  const pathPrefixes = (opts.categoryPathPrefixes || []).map((p) => p.replace(/\\/g, "/"));

  const diskFilePaths = all.map((f) => f.rel);
  if (opts.categories?.length) {
    for (const section of ["portfolio", "backstage", "creative-partners", "blog"] as MediaSection[]) {
      const diskFolders = await listSectionDiskFolders(section);
      if (!diskFolders.length) continue;
      aliasCache.set(
        section,
        buildSegmentAliasMap(section, opts.categories, diskFolders, diskFilePaths, canonicalPaths),
      );
    }
  }

  const result: LocalLibraryEntry[] = [];

  for (const file of all) {
    const rel = file.rel;
    if (roots && !roots.some((r) => rel === r || rel.startsWith(`${r}/`))) continue;

    const mapped = byPath.get(rel);
    const kind = kindFromName(path.basename(rel), mapped?.meta.kind);
    if (kind === "other") continue;

    const name = path.basename(rel);
    const section = sectionFromLocalPath(rel);
    const aliases =
      section && aliasCache.has(section) ? aliasCache.get(section)! : new Map<string, string>();

    const canonicalPath = opts.categories
      ? resolveCanonicalLocalPath({
          diskPath: rel,
          fileName: name,
          byBasenameMap,
          byBasenameCard,
          aliases,
        })
      : rel;

    const folderPath = canonicalPath.includes("/")
      ? canonicalPath.slice(0, canonicalPath.lastIndexOf("/"))
      : "";
    const folderLabel = opts.categories
      ? displayFolderLabel(opts.categories, canonicalPath)
      : folderPath || "ریشه";

    if (pathPrefixes.length && !fileMatchesCategoryPrefix(rel, pathPrefixes)) {
      if (!pathPrefixes.some((p) => canonicalPath === p || canonicalPath.startsWith(`${p}/`))) continue;
    }

    if (q) {
      const hay = `${name} ${folderLabel} ${canonicalPath}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }

    let stSize = mapped?.meta.bytes;
    if (stSize == null) {
      try {
        stSize = (await fs.stat(file.abs)).size;
      } catch {
        stSize = 0;
      }
    }

    const id = mapped?.entryId && Number.isFinite(mapped.entryId) ? mapped.entryId : stableLocalEntryId(rel);
    const mime =
      mapped?.meta.mime ||
      (kind === "video" ? "video/mp4" : kind === "image" ? "image/jpeg" : undefined);

    result.push({
      id,
      name,
      type: kind,
      mime,
      file_size: stSize,
      folderLabel,
      folderPath,
      canonicalPath,
      localPath: rel,
      previewUrl: file.previewUrl,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "fa"));
}
