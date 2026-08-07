#!/usr/bin/env tsx
import { readFileSync } from "fs";
import path from "path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

async function walkFolders(parentId: number | null, depth = 0, prefix = "") {
  const { listFileEntries } = await import("../lib/filesir/client");
  const entries = await listFileEntries({ parentIds: parentId != null ? [parentId] : undefined, perPage: 200 });
  for (const e of entries) {
    const label = `${prefix}${e.name} (id=${e.id}, type=${e.type}, size=${e.file_size ?? "-"})`;
    console.log(label);
    if (e.type === "folder" && depth < 4) {
      await walkFolders(e.id, depth + 1, `${prefix}  `);
    }
  }
}

loadEnvLocal();
async function main() {
  const { findLiobizRootFolder, listFileEntries } = await import("../lib/filesir/client");
  const root = await findLiobizRootFolder();
  console.log("Liobiz root:", root?.id, root?.name);
  if (root) await walkFolders(root.id);

  console.log("\n=== global search golden-backup ===");
  const hits = await listFileEntries({ query: "golden-backup", perPage: 200 });
  for (const e of hits) console.log(e.id, e.name, e.parent_id, e.file_size);
}
main().catch(console.error);
