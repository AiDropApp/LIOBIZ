#!/usr/bin/env tsx
/** Nightly backup — run via cron: 0 3 * * * cd /var/www/liobiz && pnpm backup:auto */
import { runAutoBackupIfNeeded } from "../lib/backup";
import { uploadBackupToMyFiles } from "../lib/backup-myfiles";

async function main() {
  const result = await runAutoBackupIfNeeded();
  if (result.skipped) {
    console.log("[backup] skipped:", result.reason);
    return;
  }
  console.log("[backup] created:", result.entry.id, result.entry.sizeBytes, "bytes");

  try {
    const remote = await uploadBackupToMyFiles(result.entry.filename);
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
