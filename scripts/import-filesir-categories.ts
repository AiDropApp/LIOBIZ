import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

import { ensureFolder, findLiobizRootFolder, listFileEntries } from "@/lib/filesir/client";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { readMediaCenterStore, saveBootstrap, slugify, upsertCategory } from "@/lib/media-center/store";

const SECTION_FOLDER_NAMES = new Set(MEDIA_SECTIONS.map((s) => s.folderName));

async function main() {
  const store = await readMediaCenterStore();
  let rootId = store.rootFolderId;
  if (!rootId) {
    const found = await findLiobizRootFolder();
    rootId = found?.id ?? (await ensureFolder("Liobiz", null)).id;
  }

  const sectionFolderIds: Partial<Record<MediaSection, number>> = { ...store.sectionFolderIds };
  for (const section of MEDIA_SECTIONS) {
    const sf = await ensureFolder(section.folderName, rootId);
    sectionFolderIds[section.id] = sf.id;
  }

  const imported: string[] = [];
  const rootChildren = await listFileEntries({ parentIds: [rootId], perPage: 100 });
  for (const child of rootChildren) {
    if (child.type !== "folder" || SECTION_FOLDER_NAMES.has(child.name)) continue;
    const current = await readMediaCenterStore();
    if (current.categories.some((c) => c.folderId === child.id)) continue;
    await upsertCategory({
      section: "portfolio",
      name: child.name,
      slug: slugify(child.name),
      folderId: child.id,
      sortOrder: current.categories.filter((c) => c.section === "portfolio").length,
    });
    imported.push(child.name);
  }

  const final = await readMediaCenterStore();
  final.rootFolderId = rootId;
  final.sectionFolderIds = sectionFolderIds;
  await saveBootstrap(final);

  console.log("Imported:", imported.join(", ") || "(none)");
  console.log("Categories:", final.categories.map((c) => `${c.section}:${c.name}`).join(" | "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
