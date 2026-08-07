#!/usr/bin/env tsx
import { writeFileSync } from "fs";
import path from "path";

writeFileSync(
  path.join(process.cwd(), "data", ".golden-backup-status.json"),
  JSON.stringify({ state: "idle" }, null, 2),
);
console.log("status reset to idle");
