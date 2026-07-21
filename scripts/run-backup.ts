#!/usr/bin/env tsx
/** Nightly backup — run via cron: 0 3 * * * cd /var/www/liobiz && pnpm backup:auto */
import { runAutoBackupIfNeeded } from "../lib/backup";

async function main() {
  const result = await runAutoBackupIfNeeded();
  if (result.skipped) {
    console.log("[backup] skipped:", result.reason);
    return;
  }
  console.log("[backup] created:", result.entry.id, result.entry.sizeBytes, "bytes");
}

main().catch((err) => {
  console.error("[backup] failed:", err);
  process.exit(1);
});
