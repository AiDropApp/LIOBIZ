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

loadEnvLocal();

async function main() {
  const { cleanupIncompleteGoldenSets } = await import("../lib/golden-backup-myfiles");
  const result = await cleanupIncompleteGoldenSets();
  console.log("[cleanup]", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
