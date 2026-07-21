import { listFileEntries } from "@/lib/filesir/client";
import type { FilesIrFileEntry } from "@/lib/filesir/types";
import type { MediaCenterStore, MediaSection } from "@/lib/filesir/types";
import { categoryPath } from "@/lib/media-center/categories";

export type SectionMediaEntry = FilesIrFileEntry & {
  folderId: number;
  folderLabel: string;
};

const SECTION_LABELS: Record<MediaSection, string> = {
  portfolio: "نمونه کار",
  backstage: "پشت صحنه",
  "creative-partners": "همکاران خلاق",
  blog: "بلاگ",
};

const MAX_FOLDER_DEPTH = 10;

/** All Files.ir folder IDs that belong to a media section (section root + category folders). */
export function collectSectionFolderIds(store: MediaCenterStore, section: MediaSection): number[] {
  const ids = new Set<number>();
  const sectionFolder = store.sectionFolderIds[section];
  if (sectionFolder) ids.add(sectionFolder);

  for (const cat of store.categories.filter((c) => c.section === section)) {
    ids.add(cat.folderId);
  }

  return [...ids];
}

export function folderLabelForId(
  store: MediaCenterStore,
  section: MediaSection | null,
  folderId: number,
): string {
  if (section) {
    const sectionFolder = store.sectionFolderIds[section];
    if (sectionFolder && folderId === sectionFolder) {
      return SECTION_LABELS[section] || section;
    }

    const cat = store.categories.find((c) => c.section === section && c.folderId === folderId);
    if (cat) {
      const path = categoryPath(store.categories, cat.id);
      return path || cat.name;
    }
  }

  for (const [key, id] of Object.entries(store.sectionFolderIds)) {
    if (id === folderId) return SECTION_LABELS[key as MediaSection] || key;
  }

  const anyCat = store.categories.find((c) => c.folderId === folderId);
  if (anyCat) {
    const path = categoryPath(store.categories, anyCat.id);
    return path || anyCat.name;
  }

  return `پوشه ${folderId}`;
}

async function walkFolderTree(
  folderId: number,
  store: MediaCenterStore,
  section: MediaSection | null,
  byId: Map<number, SectionMediaEntry>,
  depth = 0,
  rootLabel?: string,
): Promise<void> {
  if (depth > MAX_FOLDER_DEPTH) return;

  const label = rootLabel ?? folderLabelForId(store, section, folderId);
  let entries: FilesIrFileEntry[] = [];
  try {
    entries = await listFileEntries({ parentIds: [folderId], perPage: 200 });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.type === "folder") {
      const childLabel = `${label} / ${entry.name}`;
      await walkFolderTree(entry.id, store, section, byId, depth + 1, childLabel);
      continue;
    }
    if (entry.type !== "image" && entry.type !== "video") continue;
    if (!byId.has(entry.id)) {
      byId.set(entry.id, { ...entry, folderId, folderLabel: label });
    }
  }
}

/** Flat list of image/video files across section folders (recursive). */
export async function listSectionMediaFlat(
  store: MediaCenterStore,
  section: MediaSection,
): Promise<SectionMediaEntry[]> {
  const byId = new Map<number, SectionMediaEntry>();
  const roots = collectSectionFolderIds(store, section);

  await Promise.all(roots.map((folderId) => walkFolderTree(folderId, store, section, byId)));

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

/** All image/video under Liobiz root (recursive). */
export async function listLiobizMediaFlat(store: MediaCenterStore): Promise<SectionMediaEntry[]> {
  if (!store.rootFolderId) return [];
  const byId = new Map<number, SectionMediaEntry>();
  await walkFolderTree(store.rootFolderId, store, null, byId, 0, "Liobiz");
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

/** Direct children of one folder (folders + media). */
export async function listFolderChildren(folderId: number): Promise<FilesIrFileEntry[]> {
  return listFileEntries({ parentIds: [folderId], perPage: 200 });
}
