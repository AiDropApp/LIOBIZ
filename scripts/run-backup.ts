#!/usr/bin/env tsx
/** Nightly backup — run via cron: 0 3 * * * cd /var/www/liobiz && pnpm backup:auto */
import { readFileSync } from "fs";
import path from "path";
import { runAutoBackupIfNeeded, todayAutoBackupFilename } from "../lib/backup";
import { uploadBackupToMyFiles } from "../lib/backup-myfiles";

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
    /* .env.local optional for local dev when vars already set */
  }
}

loadEnvLocal();

async function main() {
  const result = await runAutoBackupIfNeeded();
  const filename = result.skipped ? todayAutoBackupFilename() : result.entry.filename;

  if (result.skipped) {
    console.log("[backup] skipped:", result.reason);
  } else {
    console.log("[backup] created:", result.entry.id, result.entry.sizeBytes, "bytes");
  }

  try {
    const remote = await uploadBackupToMyFiles(filename);
    if (remote.skipped) {
      console.log("[backup] myfiles skipped:", remote.reason);
    } else {
      console.log("[backup] myfiles uploaded:", remote.filename, "entryId=", remote.entryId, "pruned=", remote.remoteDeleted);
    }
  } catch (err) {
    console.error("[backup] myfiles upload failed:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[backup] failed:", err);
  process.exit(1);
});
