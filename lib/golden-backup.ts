import { spawn } from "child_process";
import { createHash } from "crypto";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { getProjectRoot } from "@/lib/paths";
import {
  ensureGoldenBackupDayFolder,
  goldenBackupDayFromSetId,
  GOLDEN_BACKUP_PREFIX,
  rotateGoldenBackups,
  uploadGoldenBackupFile,
  verifyGoldenBackupSetRemote,
  cleanupIncompleteGoldenSets,
} from "@/lib/golden-backup-myfiles";

export { GOLDEN_BACKUP_PREFIX };
export const GOLDEN_MANIFEST = "golden-manifest.json";
export const GOLDEN_LOCK_FILE = "data/.golden-backup.lock";
export const GOLDEN_STATUS_FILE = "data/.golden-backup-status.json";

export type GoldenBackupManifest = {
  version: 1;
  createdAt: string;
  type: "golden";
  timezone: "Asia/Tehran";
  includes: string[];
  excludes: string[];
  stats: {
    bytes: number;
    sha256: string;
    mediaBytes: number;
    dataBytes: number;
    codeBytes: number;
  };
};

export type GoldenBackupStatus = {
  state: "idle" | "running" | "success" | "error";
  startedAt?: string;
  finishedAt?: string;
  filename?: string;
  message?: string;
  uploaded?: { entryId: number; parts: number };
  verified?: boolean;
  verifyIssues?: string[];
};

const PROJECT_ROOT = getProjectRoot();
const TEMP_DIR = path.join(PROJECT_ROOT, "data", ".golden-temp");
const LOCK_PATH = path.join(PROJECT_ROOT, GOLDEN_LOCK_FILE);
const STATUS_PATH = path.join(PROJECT_ROOT, GOLDEN_STATUS_FILE);

const TAR_INCLUDES = [
  "app",
  "components",
  "lib",
  "scripts",
  "hooks",
  "tests",
  "types",
  "docs",
  "data",
  "public",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "next.config.ts",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "middleware.ts",
  "playwright.config.ts",
  "next-env.d.ts",
  "next-pwa.d.ts",
  "global.d.ts",
  "vitest.config.ts",
  "docker-compose.yml",
  "Dockerfile",
  "README.md",
  ".env.local",
];

const TAR_EXCLUDES = [
  "node_modules",
  ".next",
  "data/.golden-temp",
  "data/golden-backups",
  "data/.golden-backup.lock",
  "data/.golden-backup-status.json",
  "data/.golden-restore-temp",
  "deploy-full.tar",
  "next-build.tar",
  "download-protect.tar",
  "media-patch.tar",
  "*.tsbuildinfo",
  "err.txt",
  "out.txt",
  "listfiles.txt",
  "trace.txt",
  "trace-filtered.txt",
  "tsc-list.txt",
  "tsc-resolve.txt",
  "ts-trace.txt",
];

function iranTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}${get("second")}`;
}

export function goldenBackupFilename(date = new Date()) {
  return `${GOLDEN_BACKUP_PREFIX}-${iranTimestamp(date)}.tar`;
}

export async function readGoldenBackupStatus(): Promise<GoldenBackupStatus> {
  try {
    const raw = await fs.readFile(STATUS_PATH, "utf8");
    return JSON.parse(raw) as GoldenBackupStatus;
  } catch {
    return { state: "idle" };
  }
}

async function writeGoldenBackupStatus(status: GoldenBackupStatus) {
  await fs.mkdir(path.dirname(STATUS_PATH), { recursive: true });
  await fs.writeFile(STATUS_PATH, JSON.stringify(status, null, 2), "utf8");
}

export async function isGoldenBackupRunning(): Promise<boolean> {
  try {
    await fs.access(LOCK_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function withGoldenBackupLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(path.dirname(LOCK_PATH), { recursive: true });
  try {
    await fs.writeFile(LOCK_PATH, `${process.pid}:${Date.now()}`, { flag: "wx" });
  } catch {
    throw new Error("یک Golden Backup دیگر در حال اجراست. لطفاً صبر کنید.");
  }
  try {
    return await fn();
  } finally {
    await fs.unlink(LOCK_PATH).catch(() => undefined);
  }
}

function runTar(outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ["-cf", outFile];
    for (const ex of TAR_EXCLUDES) {
      args.push(`--exclude=./${ex}`);
    }
    args.push("-C", PROJECT_ROOT, ...TAR_INCLUDES);

    const child = spawn("tar", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar failed (${code}): ${stderr.slice(-2000)}`));
    });
  });
}

function runTarTest(outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-c", `tar -tf ${JSON.stringify(outFile)} | head -n 50`], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar verify failed (${code}): ${stderr.slice(-2000)}`));
    });
  });
}

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function dirSizeIfExists(rel: string): Promise<number> {
  const full = path.join(PROJECT_ROOT, rel);
  try {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("du", ["-sb", full], { maxBuffer: 10 * 1024 * 1024 });
    return Number(stdout.split(/\s+/)[0]) || 0;
  } catch {
    return 0;
  }
}

async function appendManifestToTar(tarPath: string, manifest: GoldenBackupManifest) {
  const manifestPath = path.join(TEMP_DIR, GOLDEN_MANIFEST);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("tar", ["-rf", tarPath, "-C", TEMP_DIR, GOLDEN_MANIFEST], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar append failed: ${stderr}`));
    });
  });
}

export async function createGoldenBackup(): Promise<{
  filename: string;
  localPath: string;
  manifest: GoldenBackupManifest;
}> {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const filename = goldenBackupFilename();
  const outPath = path.join(TEMP_DIR, filename);

  const mediaBytes = await dirSizeIfExists("public/media");
  const dataBytes = await dirSizeIfExists("data");
  const codeBytes =
    (await dirSizeIfExists("app")) +
    (await dirSizeIfExists("components")) +
    (await dirSizeIfExists("lib"));

  console.log("[golden] creating tar:", filename);
  await runTar(outPath);
  console.log("[golden] verifying tar readability ...");
  await runTarTest(outPath);

  const stat = await fs.stat(outPath);
  const sha256 = await hashFile(outPath);

  const manifest: GoldenBackupManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    type: "golden",
    timezone: "Asia/Tehran",
    includes: TAR_INCLUDES,
    excludes: TAR_EXCLUDES,
    stats: {
      bytes: Number(stat.size),
      sha256,
      mediaBytes,
      dataBytes,
      codeBytes,
    },
  };

  await appendManifestToTar(outPath, manifest);

  const finalStat = await fs.stat(outPath);
  manifest.stats.bytes = Number(finalStat.size);
  manifest.stats.sha256 = await hashFile(outPath);

  await fs.writeFile(`${outPath}.meta.json`, JSON.stringify(manifest, null, 2), "utf8");

  return { filename, localPath: outPath, manifest };
}

export async function cleanupLocalGoldenArtifacts() {
  const dirs = [TEMP_DIR, path.join(PROJECT_ROOT, "data", "golden-backups")];
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (
          f.startsWith(GOLDEN_BACKUP_PREFIX) ||
          f.endsWith(".meta.json") ||
          f.startsWith("golden-backup-manifest-")
        ) {
          await fs.unlink(path.join(dir, f)).catch(() => undefined);
        }
      }
    } catch {
      /* dir missing */
    }
  }
}

export type RunGoldenOptions = {
  /** Always build a fresh tar (manual button / forced run). */
  forceNew?: boolean;
};

export async function runGoldenBackupJob(options: RunGoldenOptions = {}) {
  return withGoldenBackupLock(async () => {
    const startedAt = new Date().toISOString();
    await writeGoldenBackupStatus({ state: "running", startedAt });

    try {
      await cleanupIncompleteGoldenSets();
      const created = await createGoldenBackup();
      const { filename, localPath, manifest } = created;
      console.log(
        "[golden] created:",
        filename,
        manifest.stats.bytes,
        "bytes",
        `(${(manifest.stats.bytes / 1024 / 1024 / 1024).toFixed(2)} GB)`,
      );

      const setId = path.basename(filename, ".tar");
      const folderId = await ensureGoldenBackupDayFolder(setId);
      console.log("[golden] uploading to MyFile folder", goldenBackupDayFromSetId(setId), "...");
      const uploaded = await uploadGoldenBackupFile(localPath, filename, folderId);
      console.log("[golden] uploaded entryId=", uploaded.entryId);

      console.log("[golden] verifying remote set:", setId);
      const verify = await verifyGoldenBackupSetRemote(setId);
      if (!verify.ok) {
        const detail = verify.issues.map((i) => i.message).join("; ");
        throw new Error(`تأیید بک‌آپ روی MyFiles ناموفق: ${detail}`);
      }
      console.log("[golden] remote verify OK:", verify.expectedParts, "parts,", verify.totalBytes, "bytes");

      const rotated = await rotateGoldenBackups();
      console.log("[golden] remote rotated:", rotated.deleted, "old backup(s) removed");

      await cleanupLocalGoldenArtifacts();
      await fs.rm(TEMP_DIR, { recursive: true, force: true }).catch(() => undefined);

      const result = {
        filename,
        manifest,
        uploaded,
        rotated,
      };

      await writeGoldenBackupStatus({
        state: "success",
        startedAt,
        finishedAt: new Date().toISOString(),
        filename,
        uploaded: { entryId: uploaded.entryId, parts: uploaded.parts },
        verified: true,
        message: "آپلود به MyFiles تأیید شد.",
      });

      return { ...result, verified: verify };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Golden backup failed";
      await writeGoldenBackupStatus({
        state: "error",
        startedAt,
        finishedAt: new Date().toISOString(),
        message,
      });
      await cleanupIncompleteGoldenSets().catch(() => undefined);
      await cleanupLocalGoldenArtifacts().catch(() => undefined);
      throw err;
    }
  });
}

/** @deprecated local golden storage removed — cleans leftover files */
export async function rotateLocalGoldenBackups(_maxKeep = 0) {
  await cleanupLocalGoldenArtifacts();
}
