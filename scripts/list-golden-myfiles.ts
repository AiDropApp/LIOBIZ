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
  } catch {
    /* optional */
  }
}

loadEnvLocal();

async function main() {
  const { ensureGoldenBackupFolder, listGoldenBackupsOnMyFiles, listGoldenBackupSets } = await import(
    "../lib/golden-backup-myfiles"
  );
  const { findLiobizRootFolder, listFileEntries } = await import("../lib/filesir/client");
  const folderId = await ensureGoldenBackupFolder();
  console.log("golden folderId:", folderId);
  const entries = await listGoldenBackupsOnMyFiles();
  console.log("golden entries:", entries.length);
  for (const e of entries) console.log(e.id, e.name, e.file_size);
  const sets = await listGoldenBackupSets();
  console.log("sets:", JSON.stringify(sets, null, 2));

  const root = await findLiobizRootFolder();
  if (root) {
    const all = await listFileEntries({ parentIds: [root.id], query: "golden-backup", perPage: 100 });
    console.log("search golden-backup under Liobiz:", all.length);
    for (const e of all) console.log(" ", e.id, e.name, e.file_size);
  }
}

main().catch(console.error);
