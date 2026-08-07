import type { MediaCard, MediaCenterStore, MediaSection } from "@/lib/filesir/types";
import { readMediaCenterStore, writeMediaCenterStore } from "@/lib/media-center/store";

function publishedSectionCards(store: MediaCenterStore, section: MediaSection): MediaCard[] {
  return store.cards
    .filter((c) => c.section === section && c.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapFieldToCard(
  root: "portfolio" | "backstage" | "creativePartners",
  field: string,
  value: unknown,
  card: MediaCard,
  store: MediaCenterStore,
): MediaCard | null {
  const str = typeof value === "string" ? value : String(value ?? "");

  if (root === "portfolio") {
    if (field === "title") return { ...card, title: str };
    if (field === "description") return { ...card, description: str };
    if (field === "category") {
      const name = str.trim();
      const cat = store.categories.find((c) => c.section === "portfolio" && c.name === name);
      return cat ? { ...card, categoryId: cat.id } : null;
    }
    return null;
  }

  if (root === "backstage") {
    if (field === "caption") return { ...card, caption: str };
    return null;
  }

  if (root === "creativePartners") {
    if (field === "name") return { ...card, title: str };
    if (field === "role") return { ...card, role: str };
    if (field === "showcase") return { ...card, city: str };
    if (field === "bio") return { ...card, description: str };
    if (field === "quote") return { ...card, caption: str };
    return null;
  }

  return null;
}

/** Sync inline CMS text edits to media-center cards when that section is media-driven. */
export async function syncCmsFieldToMediaCenter(path: string, value: unknown): Promise<void> {
  const match = path.match(/^(portfolio|backstage|creativePartners)\.(\d+)\.(\w+)/);
  if (!match) return;

  const [, root, indexStr, field] = match as [string, "portfolio" | "backstage" | "creativePartners", string, string];
  const index = Number(indexStr);
  if (!Number.isFinite(index) || index < 0) return;

  const section: MediaSection =
    root === "portfolio" ? "portfolio" : root === "backstage" ? "backstage" : "creative-partners";

  const store = await readMediaCenterStore();
  const cards = publishedSectionCards(store, section);
  if (cards.length === 0) return;

  const card = cards[index];
  if (!card) return;

  const updated = mapFieldToCard(root, field, value, card, store);
  if (!updated) return;

  const cardIdx = store.cards.findIndex((c) => c.id === card.id);
  if (cardIdx < 0) return;

  store.cards[cardIdx] = { ...updated, updatedAt: new Date().toISOString() };
  await writeMediaCenterStore(store);
}
