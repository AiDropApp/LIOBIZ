import { promises as fs } from "fs";
import path from "path";
import type { MediaSection } from "@/lib/filesir/types";
import { getMediaRootDir } from "@/lib/media-center/local-map";
import {
  sectionFolderName,
} from "@/lib/media-center/category-path-utils";

export {
  categoryDiskRelPath,
  categoryDiskPrefixes,
  fileMatchesCategoryPrefix,
  resolveCategoryIdFromLocalPath,
  isAdminVisibleCategory,
  filterVisibleRootCategories,
  filterVisibleSubCategories,
  sectionFolderName,
} from "@/lib/media-center/category-path-utils";

const SKIP_FOLDER_NAMES = new Set([".thumbs", "uploads", "backup"]);

export async function ensureLocalCategoryDir(relPath: string): Promise<string> {
  const root = getMediaRootDir();
  const abs = path.join(root, relPath.replace(/\//g, path.sep));
  if (!abs.startsWith(path.resolve(root) + path.sep) && abs !== path.resolve(root)) {
    throw new Error("مسیر دسته نامعتبر است.");
  }
  await fs.mkdir(abs, { recursive: true });
  return relPath.replace(/\\/g, "/");
}

export async function listSectionDiskFolders(section: MediaSection): Promise<
  { main: string; subs: string[] }[]
> {
  const root = getMediaRootDir();
  const sectionDir = path.join(root, sectionFolderName(section));
  const out: { main: string; subs: string[] }[] = [];

  let entries;
  try {
    entries = await fs.readdir(sectionDir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_FOLDER_NAMES.has(entry.name.toLowerCase())) continue;
    if (entry.name === "backup") continue;

    const mainPath = path.join(sectionDir, entry.name);
    let subs: string[] = [];
    try {
      const subEntries = await fs.readdir(mainPath, { withFileTypes: true });
      subs = subEntries.filter((s) => s.isDirectory()).map((s) => s.name);
    } catch {
      subs = [];
    }
    out.push({ main: entry.name, subs });
  }

  return out;
}
