import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { closeDb, getDb } from "@/lib/db";
import { downloadGoldenTarFromMyFiles } from "@/lib/golden-backup-myfiles";
import { withGoldenBackupLock } from "@/lib/golden-backup";
import { getProjectRoot } from "@/lib/paths";

const PROJECT_ROOT = getProjectRoot();
const RESTORE_TEMP = path.join(PROJECT_ROOT, "data", ".golden-restore-temp");

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} failed (${code}): ${stderr.slice(-3000)}`));
    });
  });
}

export async function restoreGoldenBackupFromMyFiles(setId: string) {
  if (!/^golden-backup-\d{4}-\d{2}-\d{2}-\d{6}$/.test(setId)) {
    throw new Error("شناسه Golden Backup نامعتبر است.");
  }

  return withGoldenBackupLock(async () => {
    await fs.mkdir(RESTORE_TEMP, { recursive: true });
    const tarPath = path.join(RESTORE_TEMP, `${setId}.tar`);

    try {
      console.log("[golden-restore] downloading set:", setId);
      await downloadGoldenTarFromMyFiles(setId, tarPath);

      closeDb();

      console.log("[golden-restore] extracting to project root ...");
      await runCommand("tar", ["-xf", tarPath, "-C", PROJECT_ROOT]);

      getDb();

      console.log("[golden-restore] complete:", setId);
      return { setId, restoredAt: new Date().toISOString() };
    } finally {
      await fs.rm(RESTORE_TEMP, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}
