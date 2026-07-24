import { promises as fs } from "fs";
import path from "path";
import type { MediaSection } from "@/lib/filesir/types";
import { getMediaRootDir, readLocalMap, type LocalMediaEntry } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";

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
      return ["portfolio"];
    case "backstage":
      return ["backstage", "پروژه ها/backstage", "پروژهها/backstage"];
    case "creative-partners":
      return ["creative-partners", "پروژه ها/creative-partners", "پروژهها/creative-partners"];
    case "blog":
      return ["blog"];
    default:
      return [section];
  }
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
  const root = getMediaRootDir();
  try {
    const files = await walkFiles(root);
    return files.length > 0;
  } catch {
    return false;
  }
}

export async function listLocalMediaFlat(opts: {
  section?: MediaSection | null;
  query?: string;
  categoryNames?: string[];
}): Promise<LocalLibraryEntry[]> {
  const root = getMediaRootDir();
  const map = await readLocalMap();
  const byPath = new Map<string, { entryId: number; meta: LocalMediaEntry }>();
  for (const [id, meta] of Object.entries(map.entries)) {
    byPath.set(meta.localPath.replace(/^\/+/, ""), { entryId: Number(id), meta });
  }

  const all = await walkFiles(root);
  const roots = opts.section ? sectionRoots(opts.section) : null;
  const q = opts.query?.trim().toLowerCase();
  const catNames = (opts.categoryNames || []).map((n) => n.toLowerCase()).filter(Boolean);

  const result: LocalLibraryEntry[] = [];

  for (const file of all) {
    const rel = file.rel;
    if (roots && !roots.some((r) => rel === r || rel.startsWith(`${r}/`))) continue;

    const mapped = byPath.get(rel);
    const kind = kindFromName(path.basename(rel), mapped?.meta.kind);
    if (kind === "other") continue;

    const folderPath = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
    const folderLabel = folderPath || "ریشه";
    const name = path.basename(rel);

    if (catNames.length) {
      const hay = `${folderLabel}/${name}`.toLowerCase();
      if (!catNames.some((n) => hay.includes(n))) continue;
    }

    if (q) {
      const hay = `${name} ${folderLabel}`.toLowerCase();
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
      localPath: rel,
      previewUrl: publicMediaUrl(rel),
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "fa"));
}
