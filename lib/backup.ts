import { createHash } from "crypto";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";
import type { Archiver } from "archiver";
import { checkpointDb, closeDb, getDb, users } from "@/lib/db";
import { mergeContent, readSiteContent } from "@/lib/content-store";
import type { SiteContent } from "@/lib/content-store";
import { getBackupsDir, getDataDir, getProjectRoot, getUploadsDir } from "@/lib/paths";

function createZipArchiver(): Archiver {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ZipArchive } = require("archiver") as {
    ZipArchive: new (options?: { zlib?: { level?: number } }) => Archiver;
  };
  return new ZipArchive({ zlib: { level: 9 } });
}

export const MAX_BACKUPS = 7;
export const BACKUP_MANIFEST = "manifest.json";

const PROJECT_ROOT = getProjectRoot();
const DATA_DIR = getDataDir();
const BACKUPS_DIR = getBackupsDir();
const LOCK_FILE = path.join(BACKUPS_DIR, ".operation.lock");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const MEDIA_CENTER_FILE = path.join(DATA_DIR, "media-center.json");
const DB_PATH = path.join(DATA_DIR, "liobiz.db");
const UPLOADS_DIR = getUploadsDir();
const MIN_FREE_BYTES = 100 * 1024 * 1024;

export type BackupType = "auto" | "manual" | "pre-restore";

export type BackupManifest = {
  version: 1;
  createdAt: string;
  type: BackupType;
  buildId?: string;
  includes: Array<"database" | "cms" | "uploads">;
  stats: {
    users: number;
    portfolioItems: number;
    uploadsFiles: number;
    uploadsBytes: number;
    mediaCenterCards?: number;
    mediaCenterCategories?: number;
  };
  sha256?: string;
};

export type BackupEntry = {
  id: string;
  filename: string;
  createdAt: string;
  type: BackupType;
  sizeBytes: number;
  stats: BackupManifest["stats"];
  includes: BackupManifest["includes"];
  buildId?: string;
  sha256?: string;
};

export type RestorePreview = {
  backup: BackupManifest;
  current: BackupManifest["stats"];
  buildIdCurrent?: string;
  warnings: string[];
};

export type RestoreScope = {
  database: boolean;
  cms: boolean;
  uploads: boolean;
  uploadMode: "merge" | "replace";
};

export const FULL_RESTORE: RestoreScope = {
  database: true,
  cms: true,
  uploads: true,
  uploadMode: "merge",
};

async function readBuildId(): Promise<string | undefined> {
  try {
    return (await fs.readFile(path.join(getProjectRoot(), ".next", "BUILD_ID"), "utf8")).trim();
  } catch {
    return undefined;
  }
}

async function dirSizeAndCount(root: string): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;
  try {
    await walkDir(root, async (filePath, stat) => {
      if (stat.isFile()) {
        files += 1;
        bytes += Number(stat.size);
      }
    });
  } catch {
    // missing uploads dir
  }
  return { files, bytes };
}

async function walkDir(
  dir: string,
  onEntry: (filePath: string, stat: Awaited<ReturnType<typeof fs.stat>>) => Promise<void>,
) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const stat = await fs.stat(full);
    if (entry.isDirectory()) {
      await walkDir(full, onEntry);
    } else {
      await onEntry(full, stat);
    }
  }
}

async function collectStats(): Promise<BackupManifest["stats"]> {
  let userCount = 0;
  let portfolioItems = 0;
  try {
    const db = getDb();
    userCount = db.select().from(users).all().filter((u) => u.role === "client").length;
  } catch {
    // db may be unavailable during edge cases
  }
  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw) as SiteContent;
    portfolioItems = Array.isArray(parsed.portfolio) ? parsed.portfolio.length : 0;
  } catch {
    // no cms yet
  }
  const uploads = await dirSizeAndCount(UPLOADS_DIR);
  let mediaCenterCards = 0;
  let mediaCenterCategories = 0;
  try {
    const raw = await fs.readFile(MEDIA_CENTER_FILE, "utf8");
    const parsed = JSON.parse(raw) as { cards?: unknown[]; categories?: unknown[] };
    mediaCenterCards = Array.isArray(parsed.cards) ? parsed.cards.length : 0;
    mediaCenterCategories = Array.isArray(parsed.categories) ? parsed.categories.length : 0;
  } catch {
    /* no media center yet */
  }
  return {
    users: userCount,
    portfolioItems,
    uploadsFiles: uploads.files,
    uploadsBytes: uploads.bytes,
    mediaCenterCards,
    mediaCenterCategories,
  };
}

function backupFilename(type: BackupType, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  if (type === "auto") return `backup-${y}-${m}-${d}-auto.zip`;
  if (type === "pre-restore") return `pre-restore-${y}-${m}-${d}-${hh}${mm}${ss}.zip`;
  return `backup-${y}-${m}-${d}-${hh}${mm}${ss}-manual.zip`;
}

export async function ensureBackupsDir() {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

function metaPathFor(filename: string) {
  return path.join(BACKUPS_DIR, `${path.basename(filename)}.meta.json`);
}

async function readMeta(filename: string): Promise<{ sha256?: string; manifest?: BackupManifest } | null> {
  try {
    const raw = await fs.readFile(metaPathFor(filename), "utf8");
    return JSON.parse(raw) as { sha256?: string; manifest?: BackupManifest };
  } catch {
    return null;
  }
}

async function writeMeta(filename: string, sha256: string, manifest: BackupManifest) {
  await fs.writeFile(
    metaPathFor(filename),
    JSON.stringify({ sha256, manifest: { ...manifest, sha256 } }, null, 2),
    "utf8",
  );
}

async function assertDiskSpace(requiredBytes: number) {
  try {
    const { statfs } = await import("fs/promises");
    const stat = await statfs(DATA_DIR);
    const free = Number(stat.bfree) * Number(stat.bsize);
    if (free < MIN_FREE_BYTES + requiredBytes) {
      throw new Error("فضای دیسک کافی برای بک‌آپ نیست.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("فضای دیسک")) throw err;
  }
}

async function withBackupLock<T>(fn: () => Promise<T>): Promise<T> {
  await ensureBackupsDir();
  try {
    await fs.writeFile(LOCK_FILE, `${process.pid}:${Date.now()}`, { flag: "wx" });
  } catch {
    throw new Error("عملیات بک‌آپ دیگری در حال اجراست. چند ثانیه بعد دوباره تلاش کنید.");
  }
  try {
    return await fn();
  } finally {
    await fs.unlink(LOCK_FILE).catch(() => undefined);
  }
}

export function verifyBackupStructure(zip: AdmZip): BackupManifest {
  const manifest = readManifestFromZipSync(zip);
  if (!manifest.includes?.length) throw new Error("manifest ناقص است.");
  if (manifest.includes.includes("database") && !zip.getEntry("data/liobiz.db")) {
    throw new Error("فایل دیتابیس در بک‌آپ یافت نشد.");
  }
  if (manifest.includes.includes("cms") && !zip.getEntry("data/site-content.json")) {
    throw new Error("فایل CMS در بک‌آپ یافت نشد.");
  }
  return manifest;
}

function readManifestFromZipSync(zip: AdmZip): BackupManifest {
  const entry = zip.getEntry(BACKUP_MANIFEST);
  if (!entry) throw new Error("فایل بک‌آپ معتبر نیست (manifest یافت نشد).");
  return JSON.parse(entry.getData().toString("utf8")) as BackupManifest;
}

async function verifySha256(filename: string, buffer: Buffer) {
  const meta = await readMeta(filename);
  if (!meta?.sha256) return;
  const actual = hashBuffer(buffer);
  if (actual !== meta.sha256) {
    throw new Error("checksum بک‌آپ با meta مطابقت ندارد — فایل ممکن است خراب شده باشد.");
  }
}

async function addUploadsToArchive(archive: Archiver) {
  try {
    await fs.access(UPLOADS_DIR);
    archive.directory(UPLOADS_DIR, "uploads");
  } catch {
    // no uploads yet
  }
}

function finalizeArchive(archive: Archiver, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outFile);
    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    void archive.finalize();
  });
}

async function createBackupInternal(type: BackupType): Promise<BackupEntry> {
  await ensureBackupsDir();
  getDb();
  await readSiteContent();
  checkpointDb();

  const createdAt = new Date().toISOString();
  const stats = await collectStats();
  const buildId = await readBuildId();
  const includes: BackupManifest["includes"] = ["database", "cms", "uploads"];
  let manifest: BackupManifest = {
    version: 1,
    createdAt,
    type,
    buildId,
    includes,
    stats,
  };

  const filename = backupFilename(type);
  if (type === "auto") {
    try {
      await fs.unlink(path.join(BACKUPS_DIR, filename));
      await fs.unlink(metaPathFor(filename)).catch(() => undefined);
    } catch {
      // no same-day auto yet
    }
  }

  const outPath = path.join(BACKUPS_DIR, filename);
  const tempPath = `${outPath}.tmp`;

  const dbStat = await fs.stat(DB_PATH).catch(() => null);
  const cmsStat = await fs.stat(CONTENT_FILE).catch(() => null);
  const uploads = await dirSizeAndCount(UPLOADS_DIR);
  const estimate = (dbStat?.size || 0) + (cmsStat?.size || 0) + uploads.bytes + 512 * 1024;
  await assertDiskSpace(estimate);

  const archive = createZipArchiver();
  archive.append(JSON.stringify(manifest, null, 2), { name: BACKUP_MANIFEST });
  archive.file(DB_PATH, { name: "data/liobiz.db" });
  archive.file(CONTENT_FILE, { name: "data/site-content.json" });
  try {
    await fs.access(MEDIA_CENTER_FILE);
    archive.file(MEDIA_CENTER_FILE, { name: "data/media-center.json" });
  } catch {
    /* optional until first media bootstrap */
  }
  await addUploadsToArchive(archive);
  await finalizeArchive(archive, tempPath);

  await fs.rename(tempPath, outPath);

  const zipBuffer = await fs.readFile(outPath);
  const sha256 = hashBuffer(zipBuffer);
  manifest = { ...manifest, sha256 };
  await writeMeta(filename, sha256, manifest);
  await rotateBackups();

  const stat = await fs.stat(outPath);
  return {
    id: filename,
    filename,
    createdAt,
    type,
    sizeBytes: Number(stat.size),
    stats,
    includes,
    buildId,
    sha256,
  };
}

export async function createBackup(type: BackupType): Promise<BackupEntry> {
  return withBackupLock(() => createBackupInternal(type));
}

export async function rotateBackups() {
  await ensureBackupsDir();
  const files = await fs.readdir(BACKUPS_DIR);
  const zips = files.filter((f) => f.endsWith(".zip"));
  const withStat = await Promise.all(
    zips.map(async (filename) => {
      const full = path.join(BACKUPS_DIR, filename);
      const stat = await fs.stat(full);
      return { filename, mtime: stat.mtimeMs };
    }),
  );
  withStat.sort((a, b) => b.mtime - a.mtime);
  const toDelete = withStat.slice(MAX_BACKUPS);
  for (const item of toDelete) {
    await fs.unlink(path.join(BACKUPS_DIR, item.filename)).catch(() => undefined);
    await fs.unlink(metaPathFor(item.filename)).catch(() => undefined);
  }
}

async function readManifestFromZip(zip: AdmZip): Promise<BackupManifest> {
  return readManifestFromZipSync(zip);
}

async function ensureMetaSidecar(filename: string, buffer: Buffer, manifest: BackupManifest) {
  const meta = await readMeta(filename);
  if (meta?.sha256) return meta.sha256;
  const sha256 = hashBuffer(buffer);
  await writeMeta(filename, sha256, { ...manifest, sha256 });
  return sha256;
}

function entryFromMeta(filename: string, stat: Awaited<ReturnType<typeof fs.stat>>, meta: { sha256?: string; manifest?: BackupManifest }): BackupEntry | null {
  const manifest = meta.manifest;
  if (!manifest) return null;
  return {
    id: filename,
    filename,
    createdAt: manifest.createdAt,
    type: manifest.type,
    sizeBytes: Number(stat.size),
    stats: manifest.stats,
    includes: manifest.includes,
    buildId: manifest.buildId,
    sha256: meta.sha256 ?? manifest.sha256,
  };
}

export async function listBackups(): Promise<BackupEntry[]> {
  await ensureBackupsDir();
  const files = (await fs.readdir(BACKUPS_DIR)).filter((f) => f.endsWith(".zip"));
  const entries: BackupEntry[] = [];

  await Promise.all(
    files.map(async (filename) => {
      const full = path.join(BACKUPS_DIR, filename);
      try {
        const stat = await fs.stat(full);
        const meta = await readMeta(filename);
        if (meta?.manifest) {
          const entry = entryFromMeta(filename, stat, meta);
          if (entry) {
            entries.push(entry);
            return;
          }
        }

        // Legacy backups without sidecar — read manifest only (no checksum on list)
        const buffer = await fs.readFile(full);
        const zip = new AdmZip(buffer);
        const manifest = readManifestFromZipSync(zip);
        entries.push({
          id: filename,
          filename,
          createdAt: manifest.createdAt,
          type: manifest.type,
          sizeBytes: Number(stat.size),
          stats: manifest.stats,
          includes: manifest.includes,
          buildId: manifest.buildId,
          sha256: meta?.sha256 ?? manifest.sha256,
        });
      } catch {
        try {
          const stat = await fs.stat(full);
          entries.push({
            id: filename,
            filename,
            createdAt: stat.mtime.toISOString(),
            type: "manual",
            sizeBytes: Number(stat.size),
            stats: { users: 0, portfolioItems: 0, uploadsFiles: 0, uploadsBytes: 0 },
            includes: ["database", "cms", "uploads"],
          });
        } catch {
          /* skip missing file */
        }
      }
    }),
  );

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return entries;
}

export function getBackupPath(filename: string): string {
  const safe = path.basename(filename);
  if (filename !== safe || !safe.endsWith(".zip")) {
    throw new Error("نام فایل نامعتبر است.");
  }
  return path.join(BACKUPS_DIR, safe);
}

async function copyTreeMerge(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  let entries: string[] = [];
  try {
    entries = await fs.readdir(src);
  } catch {
    return;
  }
  for (const name of entries) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const stat = await fs.stat(from);
    if (stat.isDirectory()) {
      await copyTreeMerge(from, to);
    } else {
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to);
    }
  }
}

async function replaceDir(src: string, dest: string) {
  await fs.rm(dest, { recursive: true, force: true });
  await copyTreeMerge(src, dest);
}

export async function deleteBackup(filename: string) {
  const full = getBackupPath(filename);
  await fs.unlink(full);
  await fs.unlink(metaPathFor(filename)).catch(() => undefined);
}

export async function previewRestore(filename: string): Promise<RestorePreview> {
  const full = getBackupPath(filename);
  const buffer = await fs.readFile(full);
  await verifySha256(filename, buffer);
  const zip = new AdmZip(buffer);
  const backup = verifyBackupStructure(zip);
  const current = await collectStats();
  const buildIdCurrent = await readBuildId();
  const warnings: string[] = [];

  if (current.users > backup.stats.users) {
    warnings.push(
      `${current.users - backup.stats.users} کاربر مشتری بعد از تاریخ این بک‌آپ ثبت‌نام کرده‌اند.`,
    );
  }
  if (current.portfolioItems > backup.stats.portfolioItems) {
    warnings.push(
      `${current.portfolioItems - backup.stats.portfolioItems} آیتم پرتفولیو بعد از بک‌آپ اضافه شده.`,
    );
  }
  if (current.uploadsFiles > backup.stats.uploadsFiles && backup.stats.uploadsFiles > 0) {
    warnings.push("فایل‌های آپلود جدید با حالت replace ممکن است از بین بروند — merge امن‌تر است.");
  }
  if (backup.buildId && buildIdCurrent && backup.buildId !== buildIdCurrent) {
    warnings.push(`build بک‌آپ (${backup.buildId}) با build فعلی (${buildIdCurrent}) متفاوت است.`);
  }
  if (warnings.length === 0) {
    warnings.push("اختلاف مهمی شناسایی نشد؛ snapshot خودکار قبل از restore گرفته می‌شود.");
  }

  return { backup, current, buildIdCurrent, warnings };
}

export async function restoreBackupBuffer(
  buffer: Buffer,
  scope: RestoreScope,
  options?: { skipPreRestore?: boolean; filename?: string },
): Promise<{ preRestoreId?: string; manifest: BackupManifest }> {
  return withBackupLock(async () => {
    const zip = new AdmZip(buffer);
    const manifest = verifyBackupStructure(zip);
    if (options?.filename) {
      await verifySha256(options.filename, buffer);
    }

    let preRestoreId: string | undefined;
    if (!options?.skipPreRestore) {
      const pre = await createBackupInternal("pre-restore");
      preRestoreId = pre.id;
    }

    const tempRoot = path.join(BACKUPS_DIR, `.restore-${Date.now()}`);
    await fs.mkdir(tempRoot, { recursive: true });
    try {
      zip.extractAllTo(tempRoot, true);

      closeDb();

      if (scope.database) {
        const srcDb = path.join(tempRoot, "data", "liobiz.db");
        try {
          await fs.access(srcDb);
        } catch {
          throw new Error("فایل دیتابیس در بک‌آپ یافت نشد.");
        }
        await fs.copyFile(srcDb, DB_PATH);
        await fs.rm(`${DB_PATH}-wal`, { force: true }).catch(() => undefined);
        await fs.rm(`${DB_PATH}-shm`, { force: true }).catch(() => undefined);
      }

      if (scope.cms) {
        const srcCms = path.join(tempRoot, "data", "site-content.json");
        try {
          await fs.access(srcCms);
        } catch {
          throw new Error("فایل CMS در بک‌آپ یافت نشد.");
        }
        const raw = await fs.readFile(srcCms, "utf8");
        const parsed = JSON.parse(raw) as Partial<SiteContent>;
        const merged = mergeContent(parsed);
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(CONTENT_FILE, JSON.stringify(merged, null, 2), "utf8");
        const srcMedia = path.join(tempRoot, "data", "media-center.json");
        try {
          await fs.access(srcMedia);
          await fs.copyFile(srcMedia, MEDIA_CENTER_FILE);
        } catch {
          /* older backups without media-center */
        }
      }

      if (scope.uploads) {
        const srcUploads = path.join(tempRoot, "uploads");
        if (scope.uploadMode === "replace") {
          await replaceDir(srcUploads, UPLOADS_DIR);
        } else {
          await copyTreeMerge(srcUploads, UPLOADS_DIR);
        }
      }

      getDb();
      return { preRestoreId, manifest };
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}

export async function restoreBackupFile(
  filename: string,
  scope: RestoreScope,
  options?: { skipPreRestore?: boolean },
) {
  const full = getBackupPath(filename);
  const buffer = await fs.readFile(full);
  return restoreBackupBuffer(buffer, scope, { ...options, filename });
}

export function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function runAutoBackupIfNeeded() {
  await ensureBackupsDir();
  const today = backupFilename("auto");
  const todayPath = path.join(BACKUPS_DIR, today);
  try {
    await fs.access(todayPath);
    return { skipped: true as const, reason: "already_exists" };
  } catch {
    const entry = await createBackup("auto");
    return { skipped: false as const, entry };
  }
}
