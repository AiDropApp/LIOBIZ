#!/usr/bin/env tsx
/** Restore golden backup from MyFiles — run in background from admin API */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { restoreGoldenBackupFromMyFiles } from "../lib/golden-restore";

const STATUS_PATH = path.join(process.cwd(), "data", ".golden-restore-status.json");

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
  const setId = process.argv[2];
  if (!setId) {
    console.error("Usage: run-golden-restore.ts <setId>");
    process.exit(1);
  }

  writeFileSync(
    STATUS_PATH,
    JSON.stringify({ state: "running", setId, startedAt: new Date().toISOString() }, null, 2),
  );

  try {
    const result = await restoreGoldenBackupFromMyFiles(setId);
    writeFileSync(
      STATUS_PATH,
      JSON.stringify(
        { state: "success", setId, startedAt: result.restoredAt, finishedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    console.log("[golden-restore] complete:", setId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "restore failed";
    writeFileSync(
      STATUS_PATH,
      JSON.stringify({ state: "error", setId, message, finishedAt: new Date().toISOString() }, null, 2),
    );
    console.error("[golden-restore] failed:", err);
    process.exit(1);
  }
}

main();
