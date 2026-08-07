import type { MediaCategory, MediaSection } from "@/lib/filesir/types";

export function categoryPath(categories: MediaCategory[], categoryId?: string | null): string {
  if (!categoryId) return "سایر";
  const parts: string[] = [];
  let current = categories.find((c) => c.id === categoryId);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
  }
  return parts.join(" › ") || "سایر";
}

export function flattenCategories(
  categories: MediaCategory[],
  section: MediaSection,
): MediaCategory[] {
  const sectionCats = categories
    .filter((c) => c.section === section)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa"));

  const out: MediaCategory[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const cat of sectionCats.filter((c) => (c.parentId ?? null) === parentId)) {
      out.push(cat);
      walk(cat.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function categorySelectOptions(
  categories: MediaCategory[],
  section: MediaSection,
): { id: string; label: string; depth: number }[] {
  return flattenCategories(categories, section).map((cat) => {
    const depth = categoryPath(categories, cat.id).split(" › ").length - 1;
    return {
      id: cat.id,
      label: categoryPath(categories, cat.id),
      depth,
    };
  });
}

export function descendantCategoryIds(
  categories: MediaCategory[],
  categoryId: string,
): Set<string> {
  const ids = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of categories) {
      if (cat.parentId && ids.has(cat.parentId) && !ids.has(cat.id)) {
        ids.add(cat.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function categoryFolderId(
  categories: MediaCategory[],
  categoryId: string | null | undefined,
  sectionFolderId?: number,
): number | undefined {
  if (categoryId) {
    return categories.find((c) => c.id === categoryId)?.folderId;
  }
  return sectionFolderId;
}

export { categoryDiskPrefixes, categoryDiskRelPath, resolveCategoryIdFromLocalPath } from "@/lib/media-center/category-path-utils";
