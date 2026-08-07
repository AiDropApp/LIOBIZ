#!/usr/bin/env tsx
/** Verify Golden Backup set(s) on MyFiles — remote (fast) or full (download + checksum + tar test). */
import { readFileSync } from "fs";
import path from "path";
import {
  listGoldenBackupSets,
  verifyGoldenBackupSetFull,
  verifyGoldenBackupSetRemote,
} from "../lib/golden-backup-myfiles";

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

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function main() {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const full = args.includes("--full");
  const setIds = args.filter((a) => !a.startsWith("--"));

  const targets =
    setIds.length > 0 ? setIds : (await listGoldenBackupSets()).map((s) => s.setId);

  if (!targets.length) {
    console.log("[verify] no golden backup sets found on MyFiles");
    process.exit(1);
  }

  let allOk = true;
  for (const setId of targets) {
    console.log(`\n[verify] ${setId} mode=${full ? "full" : "remote"}`);
    const result = full ? await verifyGoldenBackupSetFull(setId) : await verifyGoldenBackupSetRemote(setId);
    console.log("[verify] ok:", result.ok);
    if (result.totalBytes) console.log("[verify] size:", formatBytes(result.totalBytes));
    if (result.totalSha256) console.log("[verify] sha256:", result.totalSha256);
    console.log("[verify] files:", result.remoteFiles, "parts:", result.expectedParts);
    if (result.tarReadable != null) console.log("[verify] tar readable:", result.tarReadable);
    if (result.issues.length) {
      for (const issue of result.issues) {
        console.log(`  ✕ [${issue.code}] ${issue.message}`);
      }
    } else {
      console.log("  ✓ all checks passed");
    }
    if (!result.ok) allOk = false;
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});
