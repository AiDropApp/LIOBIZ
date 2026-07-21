import { promises as fs } from "fs";
import path from "path";
import { getDataDir } from "@/lib/paths";
import type { MediaCard, MediaCategory, MediaCenterStore, MediaSection } from "@/lib/filesir/types";
import { EMPTY_MEDIA_STORE } from "@/lib/filesir/types";
import { collectCardEntryIds } from "@/lib/media-center/asset-utils";

const STORE_PATH = path.join(getDataDir(), "media-center.json");

export async function readMediaCenterStore(): Promise<MediaCenterStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as MediaCenterStore;
    return { ...EMPTY_MEDIA_STORE, ...parsed, version: 1 };
  } catch {
    return { ...EMPTY_MEDIA_STORE };
  }
}

export async function writeMediaCenterStore(store: MediaCenterStore) {
  await fs.mkdir(getDataDir(), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `cat-${Date.now()}`;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function upsertCategory(
  input: Omit<MediaCategory, "id" | "createdAt"> & { id?: string; parentId?: string | null },
) {
  const store = await readMediaCenterStore();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = store.categories.findIndex((c) => c.id === input.id);
    if (idx >= 0) {
      store.categories[idx] = {
        ...store.categories[idx],
        ...input,
        id: input.id,
        parentId: input.parentId ?? store.categories[idx].parentId ?? null,
      };
    }
  } else {
    store.categories.push({
      id: newId("cat"),
      createdAt: now,
      parentId: input.parentId ?? null,
      ...input,
    });
  }
  await writeMediaCenterStore(store);
  return store;
}

export async function deleteCategory(id: string) {
  const store = await readMediaCenterStore();
  const childIds = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of store.categories) {
      if (cat.parentId === id && !childIds.has(cat.id)) {
        childIds.add(cat.id);
        changed = true;
      }
      for (const childId of childIds) {
        if (cat.parentId === childId && !childIds.has(cat.id)) {
          childIds.add(cat.id);
          changed = true;
        }
      }
    }
  }
  const removeIds = new Set([id, ...childIds]);
  store.categories = store.categories.filter((c) => !removeIds.has(c.id));
  store.cards = store.cards.filter((c) => !c.categoryId || !removeIds.has(c.categoryId));
  await writeMediaCenterStore(store);
  return store;
}

export async function upsertCard(input: Partial<MediaCard> & { section: MediaSection; title: string }) {
  const store = await readMediaCenterStore();
  const now = new Date().toISOString();
  if (input.id && store.cards.some((c) => c.id === input.id)) {
    const idx = store.cards.findIndex((c) => c.id === input.id);
    store.cards[idx] = { ...store.cards[idx], ...input, id: input.id, updatedAt: now };
  } else {
    store.cards.push({
      id: newId("card"),
      categoryId: input.categoryId ?? null,
      description: "",
      published: true,
      sortOrder: store.cards.filter((c) => c.section === input.section).length,
      createdAt: now,
      updatedAt: now,
      ...input,
    } as MediaCard);
  }
  await writeMediaCenterStore(store);
  return store;
}

export async function deleteCard(id: string) {
  const store = await readMediaCenterStore();
  store.cards = store.cards.filter((c) => c.id !== id);
  await writeMediaCenterStore(store);
  return store;
}

export async function deleteCardsByEntryIds(entryIds: number[]) {
  const wanted = new Set(entryIds.filter(Boolean));
  const store = await readMediaCenterStore();
  if (!wanted.size) return store;

  store.cards = store.cards.filter(
    (card) => !collectCardEntryIds(card).some((id) => wanted.has(id)),
  );
  await writeMediaCenterStore(store);
  return store;
}

export function getSectionFolderId(store: MediaCenterStore, section: MediaSection): number | undefined {
  return store.sectionFolderIds[section];
}

export async function saveBootstrap(store: MediaCenterStore) {
  await writeMediaCenterStore(store);
}
