import { MEDIA_SECTIONS, type MediaCategory, type MediaSection } from "@/lib/filesir/types";

const SKIP_NAMES = new Set(["backup", ".thumbs", "uploads"]);

export function sectionFolderName(section: MediaSection): string {
  return MEDIA_SECTIONS.find((s) => s.id === section)?.folderName || section;
}

export function categoryDiskRelPath(
  categories: MediaCategory[],
  categoryId: string,
): string | null {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;
  const sectionDir = sectionFolderName(cat.section);
  if (!cat.parentId) return `${sectionDir}/${cat.name}`;
  const parent = categories.find((c) => c.id === cat.parentId);
  if (!parent) return `${sectionDir}/${cat.name}`;
  return `${sectionDir}/${parent.name}/${cat.name}`;
}

export function categoryDiskPrefixes(
  categories: MediaCategory[],
  categoryId: string,
): string[] {
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
  const prefixes = new Set<string>();
  for (const id of ids) {
    const rel = categoryDiskRelPath(categories, id);
    if (rel) prefixes.add(rel);
  }
  return [...prefixes];
}

export function fileMatchesCategoryPrefix(fileRelPath: string, prefixes: string[]): boolean {
  const norm = fileRelPath.replace(/\\/g, "/");
  return prefixes.some((p) => norm === p || norm.startsWith(`${p}/`));
}

export function resolveCategoryIdFromLocalPath(
  categories: MediaCategory[],
  section: MediaSection,
  localPath: string,
): string | null {
  const norm = localPath.replace(/\\/g, "/");
  const sectionDir = sectionFolderName(section);
  if (!norm.startsWith(`${sectionDir}/`)) return null;

  const rest = norm.slice(sectionDir.length + 1);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length < 1) return null;

  const sectionCats = categories.filter((c) => c.section === section);

  if (parts.length >= 2) {
    const [mainName, subName] = parts;
    const main = sectionCats.find((c) => !c.parentId && c.name === mainName);
    if (main) {
      const sub = sectionCats.find((c) => c.parentId === main.id && c.name === subName);
      if (sub) return sub.id;
      if (mainName === subName) return main.id;
    }
  }

  const mainName = parts[0];
  const main = sectionCats.find((c) => !c.parentId && c.name === mainName);
  return main?.id ?? null;
}

export function isAdminVisibleCategory(categories: MediaCategory[], cat: MediaCategory): boolean {
  if (SKIP_NAMES.has(cat.name.toLowerCase())) return false;
  if (cat.name === "پروژه ها" || cat.name === "پروژهها") return false;
  if (cat.parentId && categories.some((c) => c.id === cat.parentId && c.parentId)) return false;
  return true;
}

export function filterVisibleRootCategories(categories: MediaCategory[], section: MediaSection) {
  return categories
    .filter((c) => c.section === section && !c.parentId && isAdminVisibleCategory(categories, c))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa"));
}

export function filterVisibleSubCategories(
  categories: MediaCategory[],
  section: MediaSection,
  parentId: string,
) {
  return categories
    .filter(
      (c) =>
        c.section === section &&
        c.parentId === parentId &&
        isAdminVisibleCategory(categories, c),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa"));
}
