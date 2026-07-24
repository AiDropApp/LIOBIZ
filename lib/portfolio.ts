import { normalizeMediaFields, type CmsMediaFields } from "@/lib/media-types";

export type PortfolioCategory = {
  id: string;
  name: string;
  coverImage?: string;
  order: number;
};

export type PortfolioItemBase = {
  id: number;
  title: string;
  /** Denormalized category name for display */
  category: string;
  categoryId: string;
  /** Card/grid image (prefers lightweight thumbnail) */
  image: string;
  /** Full-resolution image for detail modal when different from thumbnail */
  imageFull?: string;
  description?: string;
  client?: string;
  year?: string;
} & CmsMediaFields;

export const DEFAULT_PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { id: "cat-web", name: "طراحی وب‌سایت", order: 0 },
  { id: "cat-branding", name: "برندینگ", order: 1 },
  { id: "cat-social", name: "شبکه‌های اجتماعی", order: 2 },
  { id: "cat-ads", name: "تبلیغات", order: 3 },
];

export function sortCategories(categories: PortfolioCategory[]): PortfolioCategory[] {
  return [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "fa"));
}

export function categoryNameById(categories: PortfolioCategory[], id?: string): string {
  if (!id) return "";
  return categories.find((c) => c.id === id)?.name || "";
}

/** Match portfolio items against a root category chip (includes all subcategories). */
export function portfolioMatchesCategoryFilter(
  item: Pick<PortfolioItemBase, "category">,
  filterName: string,
): boolean {
  if (filterName === "همه") return true;
  const category = item.category?.trim() || "";
  return category === filterName || category.startsWith(`${filterName} › `);
}

export function resolveCategoryCover(
  cat: PortfolioCategory,
  items: Array<{ categoryId?: string; image?: string }>,
): string {
  if (cat.coverImage?.trim()) return cat.coverImage.trim();
  const first = items.find((i) => i.categoryId === cat.id && i.image?.trim());
  return first?.image || "/images/logo.png";
}

function slugId(name: string, fallback: string) {
  const ascii = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "");
  return ascii ? `cat-${ascii.slice(0, 40)}` : fallback;
}

export function normalizeCategories(raw: unknown): PortfolioCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_PORTFOLIO_CATEGORIES.map((c) => ({ ...c }));
  }

  const seen = new Set<string>();
  const categories: PortfolioCategory[] = [];

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const item = entry as Partial<PortfolioCategory>;
    const name = String(item.name || "").trim();
    if (!name) return;
    let id = String(item.id || "").trim() || slugId(name, `cat-${index + 1}`);
    if (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    categories.push({
      id,
      name,
      coverImage: item.coverImage?.trim() || undefined,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    });
  });

  return categories.length > 0 ? sortCategories(categories) : DEFAULT_PORTFOLIO_CATEGORIES.map((c) => ({ ...c }));
}

export function migratePortfolioItems(
  rawItems: unknown,
  categories: PortfolioCategory[],
): { categories: PortfolioCategory[]; portfolio: PortfolioItemBase[] } {
  const cats = [...categories];
  const byName = new Map(cats.map((c) => [c.name, c]));
  const byId = new Map(cats.map((c) => [c.id, c]));

  const ensureCategory = (name: string): PortfolioCategory => {
    const existing = byName.get(name);
    if (existing) return existing;
    const created: PortfolioCategory = {
      id: slugId(name, `cat-${Date.now()}-${cats.length}`),
      name,
      order: cats.length,
    };
    cats.push(created);
    byName.set(created.name, created);
    byId.set(created.id, created);
    return created;
  };

  const fallback = cats[0] || DEFAULT_PORTFOLIO_CATEGORIES[0];
  const source = Array.isArray(rawItems) ? rawItems : [];

  const portfolio = source.map((entry, index) => {
    const item = (entry && typeof entry === "object" ? entry : {}) as Partial<PortfolioItemBase> & {
      category?: string;
    };
    let cat =
      (item.categoryId && byId.get(String(item.categoryId))) ||
      (item.category?.trim() ? ensureCategory(item.category.trim()) : null) ||
      fallback;

    const normalized = normalizeMediaFields({
      id: Number(item.id) || Date.now() + index,
      title: String(item.title || "").trim() || `پروژه ${index + 1}`,
      category: cat.name,
      categoryId: cat.id,
      image: String(item.image || "").trim(),
      videoSrc: item.videoSrc,
      mediaKind: item.mediaKind,
      aspectRatio: item.aspectRatio,
      description: item.description?.trim() || undefined,
      client: item.client?.trim() || undefined,
      year: item.year?.trim() || undefined,
    });

    return normalized as PortfolioItemBase;
  });

  return { categories: sortCategories(cats), portfolio };
}
