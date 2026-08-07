#!/usr/bin/env tsx
/**
 * Rename mojibake media folders on disk to canonical UTF-8 (Persian) names.
 *
 * Usage:
 *   pnpm media:fix-folders              # dry-run (preview only)
 *   pnpm media:fix-folders -- --apply   # rename folders + patch JSON
 */
import { readFileSync } from "fs";
import path from "path";
import {
  buildFolderRenameAliases,
  countCorruptDiskFolders,
  patchLocalMapPaths,
  patchMediaCenterPaths,
  planAndApplyFolderRenames,
  walkMediaRelativePaths,
} from "../lib/media-center/folder-rename";
import { getMediaRootDir, readLocalMap, writeLocalMap } from "../lib/media-center/local-map";
import { readMediaCenterStore, writeMediaCenterStore } from "../lib/media-center/store";
import { snapshotJsonFile } from "../lib/json-snapshot";
import { getDataDir } from "../lib/paths";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const APPLY = process.argv.includes("--apply");

async function main() {
  const mediaRoot = getMediaRootDir();
  const map = await readLocalMap();
  const store = await readMediaCenterStore();

  const corruptBefore = await countCorruptDiskFolders(mediaRoot);
  const diskFilePaths = (await walkMediaRelativePaths(mediaRoot)).filter((p) =>
    /\.[a-zA-Z0-9]{2,5}$/.test(p),
  );

  const aliasesBySection = await buildFolderRenameAliases({
    categories: store.categories,
    cards: store.cards,
    map,
    diskFilePaths,
  });

  const aliasCount = [...aliasesBySection.values()].reduce((n, m) => n + m.size, 0);
  if (aliasCount === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: APPLY ? "apply" : "dry-run",
          message: "هیچ پوشه mojibake برای rename یافت نشد.",
          corruptFoldersBefore: corruptBefore,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`[fix-folders] ${APPLY ? "APPLY" : "DRY-RUN"} — ${aliasCount} segment alias(es)`);
  for (const [section, aliases] of aliasesBySection) {
    for (const [from, to] of aliases) {
      console.log(`  ${section}: ${JSON.stringify(from)} → ${to}`);
    }
  }

  const plan = await planAndApplyFolderRenames(mediaRoot, aliasesBySection, APPLY);

  if (plan.conflicts.length) {
    console.error("\n[fix-folders] CONFLICTS (rename skipped for these):");
    for (const c of plan.conflicts) console.error(`  - ${c}`);
  }

  console.log(`\n[fix-folders] Planned/applied renames: ${plan.renames.length}`);
  for (const r of plan.renames.slice(0, 50)) {
    console.log(`  ${r.fromRel}  →  ${r.toRel}`);
  }
  if (plan.renames.length > 50) console.log(`  … and ${plan.renames.length - 50} more`);

  if (!APPLY) {
    console.log("\n[fix-folders] Dry-run complete. Re-run with --apply to execute.");
    return;
  }

  if (plan.conflicts.length) {
    console.error("\n[fix-folders] Aborting JSON patch due to conflicts. Resolve conflicts and re-run.");
    process.exit(1);
  }

  const mapPath = path.join(getDataDir(), "filesir-local-map.json");
  const storePath = path.join(getDataDir(), "media-center.json");
  await snapshotJsonFile(mapPath, "filesir-local-map");
  await snapshotJsonFile(storePath, "media-center");

  const mapPatched = patchLocalMapPaths(map, plan.globalAliases);
  const cardsPatched = patchMediaCenterPaths(store.cards, plan.globalAliases);

  await writeLocalMap(map);
  await writeMediaCenterStore(store);

  const corruptAfter = await countCorruptDiskFolders(mediaRoot);

  const report = {
    ok: true,
    mode: "apply",
    folderRenames: plan.renames.length,
    mapPathsPatched: mapPatched,
    cardAssetPathsPatched: cardsPatched,
    corruptFoldersBefore: corruptBefore,
    corruptFoldersAfter: corruptAfter,
  };

  console.log("\n[fix-folders] Done:");
  console.log(JSON.stringify(report, null, 2));

  if (corruptAfter > 0) {
    console.warn(
      `[fix-folders] Warning: ${corruptAfter} folder(s) still look corrupted. Review aliases or rename manually.`,
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("[fix-folders] Fatal:", err);
  process.exit(1);
});
