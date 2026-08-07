import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getMediaRootDir } from "@/lib/media-center/local-map";
import { resolveCategoryIdFromLocalPath } from "@/lib/media-center/category-path-utils";
import { categoryPath } from "@/lib/media-center/categories";
import type { MediaCategory, MediaSection } from "@/lib/filesir/types";
import { readMediaCenterStore } from "@/lib/media-center/store";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".mkv", ".m4v"]);

export type DuplicateGroup = {
  key: string;
  reason: "same-content" | "same-name-size";
  files: {
    localPath: string;
    size: number;
    section: MediaSection | null;
    categoryLabel: string;
  }[];
};

async function walkMediaFiles(): Promise<{ rel: string; abs: string; size: number }[]> {
  const root = getMediaRootDir();
  const out: { rel: string; abs: string; size: number }[] = [];

  async function walk(dir: string, baseRel = "") {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === ".thumbs") continue;
        await walk(abs, rel);
      } else if (entry.isFile() && !entry.name.endsWith(".part")) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
        try {
          const st = await fs.stat(abs);
          out.push({ rel: rel.replace(/\\/g, "/"), abs, size: st.size });
        } catch {
          /* skip */
        }
      }
    }
  }

  await walk(root);
  return out;
}

function sectionFromPath(rel: string): MediaSection | null {
  const first = rel.split("/")[0];
  if (first === "portfolio" || first === "backstage" || first === "creative-partners" || first === "blog") {
    return first;
  }
  return null;
}

async function contentHash(abs: string, size: number): Promise<string> {
  // For large files, hash first 256KB + size + mtime for speed
  const buf = Buffer.alloc(Math.min(size, 256 * 1024));
  const fh = await fs.open(abs, "r");
  try {
    await fh.read(buf, 0, buf.length, 0);
  } finally {
    await fh.close();
  }
  return createHash("sha256").update(buf).update(String(size)).digest("hex").slice(0, 16);
}

function categoryLabelForPath(
  categories: MediaCategory[],
  section: MediaSection | null,
  localPath: string,
): string {
  if (!section) return localPath.includes("/") ? localPath.slice(0, localPath.lastIndexOf("/")) : "ریشه";
  const catId = resolveCategoryIdFromLocalPath(categories, section, localPath);
  return catId ? categoryPath(categories, catId) : localPath.slice(0, localPath.lastIndexOf("/"));
}

export async function findMediaDuplicates(): Promise<DuplicateGroup[]> {
  const store = await readMediaCenterStore();
  const files = await walkMediaFiles();
  const byContent = new Map<string, typeof files>();
  const byNameSize = new Map<string, typeof files>();

  for (const file of files) {
    const baseName = path.basename(file.rel);
    const nameSizeKey = `${baseName}|${file.size}`;
    if (!byNameSize.has(nameSizeKey)) byNameSize.set(nameSizeKey, []);
    byNameSize.get(nameSizeKey)!.push(file);

    const hash = await contentHash(file.abs, file.size);
    if (!byContent.has(hash)) byContent.set(hash, []);
    byContent.get(hash)!.push(file);
  }

  const groups: DuplicateGroup[] = [];
  const seen = new Set<string>();

  for (const [hash, group] of byContent) {
    if (group.length < 2) continue;
    const key = `content:${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({
      key,
      reason: "same-content",
      files: group.map((f) => {
        const section = sectionFromPath(f.rel);
        return {
          localPath: f.rel,
          size: f.size,
          section,
          categoryLabel: categoryLabelForPath(store.categories, section, f.rel),
        };
      }),
    });
  }

  for (const [nsKey, group] of byNameSize) {
    if (group.length < 2) continue;
    const paths = new Set(group.map((f) => f.rel));
    if (paths.size < 2) continue;
    const key = `name-size:${nsKey}`;
    if (seen.has(key)) continue;
    // Skip if already covered by content duplicate
    const already = groups.some(
      (g) =>
        g.reason === "same-content" &&
        g.files.length === group.length &&
        g.files.every((f) => paths.has(f.localPath)),
    );
    if (already) continue;
    seen.add(key);
    groups.push({
      key,
      reason: "same-name-size",
      files: group.map((f) => {
        const section = sectionFromPath(f.rel);
        return {
          localPath: f.rel,
          size: f.size,
          section,
          categoryLabel: categoryLabelForPath(store.categories, section, f.rel),
        };
      }),
    });
  }

  return groups.sort((a, b) => b.files.length - a.files.length);
}
