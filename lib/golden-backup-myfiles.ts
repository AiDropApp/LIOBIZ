import { createReadStream, createWriteStream, promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import {
  deleteEntries,
  ensureFolder,
  findLiobizRootFolder,
  getOrCreateShareableLink,
  listFileEntries,
  uploadSimple,
} from "@/lib/filesir/client";
import type { FilesIrFileEntry } from "@/lib/filesir/types";
export const GOLDEN_BACKUP_PREFIX = "golden-backup";
export const BACKUP_FOLDER_NAME = "backup";
export const GOLDEN_BACKUP_FOLDER_NAME = "Golden backup";
export const MAX_GOLDEN_BACKUPS = Number(process.env.GOLDEN_BACKUP_RETAIN || 2);
/** MyFile Growth plan max is 500MB/file — stay under with margin. */
export const GOLDEN_PART_BYTES = Number(process.env.GOLDEN_BACKUP_PART_BYTES || 450 * 1024 * 1024);

export type GoldenUploadManifest = {
  version: 1;
  setId: string;
  originalTar: string;
  partBytes: number;
  parts: Array<{ name: string; bytes: number; sha256: string }>;
  totalBytes: number;
  totalSha256: string;
};

export type GoldenBackupSetSummary = {
  setId: string;
  dayFolder: string;
  createdAt: string;
  totalBytes: number;
  parts: number;
  fileCount: number;
  hasManifest: boolean;
  complete: boolean;
};

export function goldenBackupDayFromSetId(setId: string): string {
  const match = setId.match(/^golden-backup-(\d{4}-\d{2}-\d{2})-/);
  if (!match) throw new Error(`شناسه Golden Backup نامعتبر: ${setId}`);
  return match[1];
}

/** Liobiz/backup/Golden backup */
export async function ensureGoldenBackupRoot(): Promise<number> {
  const root = await findLiobizRootFolder();
  const rootId = root ? root.id : (await ensureFolder("Liobiz", null)).id;
  const backupFolder = await ensureFolder(BACKUP_FOLDER_NAME, rootId);
  const goldenFolder = await ensureFolder(GOLDEN_BACKUP_FOLDER_NAME, backupFolder.id);
  return goldenFolder.id;
}

/** Liobiz/backup/Golden backup/YYYY-MM-DD — one folder per calendar day (Tehran). */
export async function ensureGoldenBackupDayFolder(setId: string): Promise<number> {
  const goldenRoot = await ensureGoldenBackupRoot();
  const day = goldenBackupDayFromSetId(setId);
  return (await ensureFolder(day, goldenRoot)).id;
}

/** @deprecated use ensureGoldenBackupRoot */
export async function ensureGoldenBackupFolder(): Promise<number> {
  return ensureGoldenBackupRoot();
}

function isGoldenBackupFileName(name: string): boolean {
  if (!name.startsWith(GOLDEN_BACKUP_PREFIX) && !name.startsWith(`${GOLDEN_BACKUP_PREFIX}-manifest-`)) {
    return false;
  }
  return (
    name.endsWith(".tar") ||
    name.endsWith(".json") ||
    name.includes(".part.") ||
    /\.part\d+$/.test(name)
  );
}

function goldenBackupEntries(entries: FilesIrFileEntry[]): FilesIrFileEntry[] {
  return entries.filter((entry) => entry.type !== "folder" && isGoldenBackupFileName(entry.name));
}

export function goldenBackupSetId(name: string): string | null {
  const tar = name.match(/^(golden-backup-\d{4}-\d{2}-\d{2}-\d{6})\.tar$/);
  if (tar) return tar[1];
  const part = name.match(/^(golden-backup-\d{4}-\d{2}-\d{2}-\d{6})\.part/);
  if (part) return part[1];
  const manifest = name.match(/^golden-backup-manifest-(golden-backup-\d{4}-\d{2}-\d{2}-\d{6})\.json$/);
  if (manifest) return manifest[1];
  return null;
}

function sortByNewest(entries: FilesIrFileEntry[]): FilesIrFileEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = Date.parse(a.created_at || "") || 0;
    const bTime = Date.parse(b.created_at || "") || 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.name.localeCompare(a.name);
  });
}

export async function rotateGoldenBackups() {
  const goldenRoot = await ensureGoldenBackupRoot();
  const entries = await listFileEntries({ parentIds: [goldenRoot], perPage: 200 });

  const dayFolders = entries
    .filter((e) => e.type === "folder" && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  const toRemove = dayFolders.slice(MAX_GOLDEN_BACKUPS);
  let deleted = 0;
  for (const folder of toRemove) {
    const files = await listFileEntries({ parentIds: [folder.id], perPage: 200 });
    if (!files.length) continue;
    await deleteEntries(
      files.map((entry) => entry.id),
      false,
    );
    deleted += files.length;
    console.log("[golden] rotated day folder:", folder.name, files.length, "file(s) removed");
  }

  return { deleted, kept: Math.min(dayFolders.length, MAX_GOLDEN_BACKUPS) };
}

function splitTarIntoParts(tarPath: string, setId: string, partBytes: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const outPrefix = tarPath.replace(/\.tar$/, ".part");
    const child = spawn("split", ["-b", String(partBytes), "-a", "3", "-d", tarPath, `${outPrefix}.`], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`split failed (${code}): ${stderr}`));
        return;
      }
      try {
        const dir = path.dirname(tarPath);
        const parts = (await fs.readdir(dir))
          .filter((f) => f.startsWith(`${setId}.part.`))
          .sort()
          .map((f) => path.join(dir, f));
        resolve(parts);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function sha256File(filePath: string): Promise<string> {
  const { createHash } = await import("crypto");
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(filePath)
      .on("data", (c) => hash.update(c))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

export type GoldenVerifyIssue = {
  code: string;
  message: string;
};

export type GoldenVerifyResult = {
  setId: string;
  ok: boolean;
  mode: "remote" | "full";
  issues: GoldenVerifyIssue[];
  manifest?: GoldenUploadManifest;
  remoteFiles: number;
  expectedParts: number;
  totalBytes?: number;
  totalSha256?: string;
  tarReadable?: boolean;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadSmallFile(filePath: string, parentId: number, retries = 3) {
  const name = path.basename(filePath);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const buf = await fs.readFile(filePath);
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const result = await uploadSimple(blob, name, parentId);
      return result.fileEntry;
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[golden] upload ${name} attempt ${attempt}/${retries} failed: ${message}`);
      if (attempt < retries) await sleep(4000 * attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Reassemble split parts locally and confirm checksum before upload. */
async function verifySplitIntegrity(tarPath: string, partPaths: string[], expectedSha256: string) {
  const verifyPath = `${tarPath}.verify.tmp`;
  try {
    await concatFiles(partPaths, verifyPath);
    const sha = await sha256File(verifyPath);
    if (sha !== expectedSha256) {
      throw new Error("split integrity check failed: reassembled checksum mismatch");
    }
    console.log("[golden] split integrity OK:", partPaths.length, "parts");
  } finally {
    await fs.unlink(verifyPath).catch(() => undefined);
  }
}

/** Split tar into <=450MB parts and upload all pieces + manifest to MyFile. */
export async function uploadGoldenBackupFile(
  filePath: string,
  filename: string,
  parentId: number,
): Promise<{ entryId: number; filename: string; parts: number }> {
  const stat = await fs.stat(filePath);
  const setId = path.basename(filename, ".tar");

  if (stat.size <= GOLDEN_PART_BYTES) {
    const entry = await uploadSmallFile(filePath, parentId);
    return { entryId: entry.id, filename: entry.name, parts: 1 };
  }

  console.log(
    `[golden] splitting ${(stat.size / 1024 / 1024 / 1024).toFixed(2)} GB into ${(GOLDEN_PART_BYTES / 1024 / 1024).toFixed(0)} MB parts`,
  );
  const partPaths = await splitTarIntoParts(filePath, setId, GOLDEN_PART_BYTES);
  const totalSha256 = await sha256File(filePath);
  await verifySplitIntegrity(filePath, partPaths, totalSha256);
  const partsMeta: GoldenUploadManifest["parts"] = [];

  for (let i = 0; i < partPaths.length; i++) {
    const partPath = partPaths[i];
    const partStat = await fs.stat(partPath);
    const partSha = await sha256File(partPath);
    console.log(`[golden] uploading part ${i + 1}/${partPaths.length}: ${path.basename(partPath)}`);
    await uploadSmallFile(partPath, parentId);
    partsMeta.push({
      name: path.basename(partPath),
      bytes: Number(partStat.size),
      sha256: partSha,
    });
    await fs.unlink(partPath).catch(() => undefined);
  }

  const uploadManifest: GoldenUploadManifest = {
    version: 1,
    setId,
    originalTar: path.basename(filename),
    partBytes: GOLDEN_PART_BYTES,
    parts: partsMeta,
    totalBytes: Number(stat.size),
    totalSha256,
  };
  const manifestName = `golden-backup-manifest-${setId}.json`;
  const manifestPath = path.join(path.dirname(filePath), manifestName);
  await fs.writeFile(manifestPath, JSON.stringify(uploadManifest, null, 2), "utf8");
  const manifestEntry = await uploadSmallFile(manifestPath, parentId);
  await fs.unlink(manifestPath).catch(() => undefined);

  return {
    entryId: manifestEntry.id,
    filename: manifestName,
    parts: partPaths.length,
  };
}

export async function listGoldenBackupsOnMyFiles() {
  const goldenRoot = await ensureGoldenBackupRoot();
  const rootEntries = await listFileEntries({ parentIds: [goldenRoot], perPage: 200 });
  const all: FilesIrFileEntry[] = [...goldenBackupEntries(rootEntries)];

  const dayFolders = rootEntries.filter(
    (e) => e.type === "folder" && /^\d{4}-\d{2}-\d{2}$/.test(e.name),
  );
  for (const folder of dayFolders) {
    const files = await listFileEntries({ parentIds: [folder.id], perPage: 200 });
    all.push(...goldenBackupEntries(files));
  }

  return sortByNewest(all);
}

export async function listGoldenBackupSets(): Promise<GoldenBackupSetSummary[]> {
  const entries = await listGoldenBackupsOnMyFiles();
  const sets = new Map<string, FilesIrFileEntry[]>();
  for (const entry of entries) {
    const setId = goldenBackupSetId(entry.name);
    if (!setId) continue;
    const list = sets.get(setId) || [];
    list.push(entry);
    sets.set(setId, list);
  }

  return [...sets.entries()]
    .map(([setId, files]) => {
      const manifest = files.find((f) => f.name === `golden-backup-manifest-${setId}.json`);
      const partFiles = files.filter((f) => f.name.includes(".part."));
      const tarFile = files.find((f) => f.name === `${setId}.tar`);
      const times = files.map((f) => Date.parse(f.created_at || "") || 0);
      const totalBytes = files.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0);

      return {
        setId,
        dayFolder: goldenBackupDayFromSetId(setId),
        createdAt: new Date(Math.max(...times, 0)).toISOString(),
        totalBytes: tarFile ? Number(tarFile.file_size || 0) : totalBytes,
        parts: partFiles.length || (tarFile ? 1 : 0),
        fileCount: files.length,
        hasManifest: Boolean(manifest),
        complete: Boolean(manifest) && (Boolean(tarFile) || partFiles.length >= 1),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getGoldenSetFiles(setId: string): Promise<FilesIrFileEntry[]> {
  const entries = await listGoldenBackupsOnMyFiles();
  return entries.filter((e) => goldenBackupSetId(e.name) === setId);
}

export async function deleteGoldenSetFiles(setId: string) {
  const files = await getGoldenSetFiles(setId);
  if (!files.length) return { deleted: 0 };
  await deleteEntries(
    files.map((f) => f.id),
    false,
  );
  return { deleted: files.length };
}

/** Remove sets that have parts/tar but no manifest (failed upload). */
export async function cleanupIncompleteGoldenSets() {
  const entries = await listGoldenBackupsOnMyFiles();
  const sets = new Map<string, FilesIrFileEntry[]>();
  for (const entry of entries) {
    const setId = goldenBackupSetId(entry.name);
    if (!setId) continue;
    const list = sets.get(setId) || [];
    list.push(entry);
    sets.set(setId, list);
  }

  let deleted = 0;
  for (const [setId, files] of sets) {
    const hasManifest = files.some((f) => f.name === `golden-backup-manifest-${setId}.json`);
    const hasTar = files.some((f) => f.name === `${setId}.tar`);
    if (hasTar || hasManifest) continue;
    const result = await deleteGoldenSetFiles(setId);
    deleted += result.deleted;
    console.log("[golden] removed incomplete set:", setId, result.deleted, "file(s)");
  }
  return { deleted };
}

export async function downloadFileEntryToPath(entryId: number, destPath: string) {
  const { publicUrl } = await getOrCreateShareableLink(entryId);
  const res = await fetch(publicUrl);
  if (!res.ok) {
    throw new Error(`دانلود از MyFiles ناموفق (${res.status})`);
  }
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function concatFiles(inputs: string[], output: string) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const out = createWriteStream(output);
  for (const input of inputs) {
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(input);
      stream.on("error", reject);
      stream.on("end", () => resolve());
      stream.pipe(out, { end: false });
    });
  }
  await new Promise<void>((resolve, reject) => {
    out.on("error", reject);
    out.on("finish", resolve);
    out.end();
  });
}

export async function downloadGoldenTarFromMyFiles(setId: string, destTarPath: string) {
  const files = await getGoldenSetFiles(setId);
  if (!files.length) {
    throw new Error("این Golden Backup روی MyFiles یافت نشد.");
  }

  const tarEntry = files.find((f) => f.name === `${setId}.tar`);
  if (tarEntry) {
    await downloadFileEntryToPath(tarEntry.id, destTarPath);
    return destTarPath;
  }

  const manifestName = `golden-backup-manifest-${setId}.json`;
  const manifestEntry = files.find((f) => f.name === manifestName);
  if (!manifestEntry) {
    throw new Error("manifest این Golden Backup روی MyFiles یافت نشد.");
  }

  const tempDir = path.join(path.dirname(destTarPath), `.parts-${setId}`);
  await fs.mkdir(tempDir, { recursive: true });

  const manifestPath = path.join(tempDir, manifestName);
  await downloadFileEntryToPath(manifestEntry.id, manifestPath);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as GoldenUploadManifest;

  const partPaths: string[] = [];
  for (const part of manifest.parts) {
    const entry = files.find((f) => f.name === part.name);
    if (!entry) {
      throw new Error(`قطعه ${part.name} روی MyFiles یافت نشد.`);
    }
    const partPath = path.join(tempDir, part.name);
    console.log("[golden-restore] downloading part:", part.name);
    await downloadFileEntryToPath(entry.id, partPath);
    partPaths.push(partPath);
  }

  await concatFiles(partPaths, destTarPath);
  const sha = await sha256File(destTarPath);
  if (sha !== manifest.totalSha256) {
    throw new Error("checksum فایل بازسازی‌شده با manifest مطابقت ندارد.");
  }

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  return destTarPath;
}

async function verifyTarReadable(tarPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("tar", ["-tf", tarPath], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => {
      if (code !== 0) console.warn("[golden] tar test failed:", stderr.slice(-500));
      resolve(code === 0);
    });
  });
}

/** Quick remote check: manifest + all parts present with expected sizes. */
export async function verifyGoldenBackupSetRemote(setId: string): Promise<GoldenVerifyResult> {
  const issues: GoldenVerifyIssue[] = [];
  const files = await getGoldenSetFiles(setId);
  if (!files.length) {
    return {
      setId,
      ok: false,
      mode: "remote",
      issues: [{ code: "not_found", message: "این set روی MyFiles یافت نشد." }],
      remoteFiles: 0,
      expectedParts: 0,
    };
  }

  const tarEntry = files.find((f) => f.name === `${setId}.tar`);
  if (tarEntry) {
    const size = Number(tarEntry.file_size || 0);
    if (size <= 0) issues.push({ code: "tar_size", message: "حجم tar روی MyFiles نامعتبر است." });
    return {
      setId,
      ok: issues.length === 0,
      mode: "remote",
      issues,
      remoteFiles: 1,
      expectedParts: 1,
      totalBytes: size,
    };
  }

  const manifestName = `golden-backup-manifest-${setId}.json`;
  const manifestEntry = files.find((f) => f.name === manifestName);
  if (!manifestEntry) {
    issues.push({ code: "manifest_missing", message: "manifest روی MyFiles نیست — بک‌آپ ناقص است." });
    const orphanParts = files.filter((f) => f.name.includes(".part."));
    if (orphanParts.length) {
      issues.push({
        code: "orphan_parts",
        message: `${orphanParts.length} part بدون manifest روی MyFiles مانده.`,
      });
    }
    return {
      setId,
      ok: false,
      mode: "remote",
      issues,
      remoteFiles: files.length,
      expectedParts: orphanParts.length,
    };
  }

  const tempDir = path.join(process.cwd(), "data", ".golden-verify-temp");
  await fs.mkdir(tempDir, { recursive: true });
  const manifestPath = path.join(tempDir, manifestName);
  let manifest: GoldenUploadManifest;
  try {
    await downloadFileEntryToPath(manifestEntry.id, manifestPath);
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as GoldenUploadManifest;
  } catch (err) {
    issues.push({
      code: "manifest_read",
      message: err instanceof Error ? err.message : "خواندن manifest ناموفق بود.",
    });
    return { setId, ok: false, mode: "remote", issues, remoteFiles: files.length, expectedParts: 0 };
  } finally {
    await fs.unlink(manifestPath).catch(() => undefined);
  }

  if (manifest.setId !== setId) {
    issues.push({ code: "set_id_mismatch", message: "setId داخل manifest با درخواست مطابقت ندارد." });
  }
  if (manifest.totalBytes <= 0) {
    issues.push({ code: "total_bytes", message: "totalBytes در manifest نامعتبر است." });
  }
  if (!manifest.totalSha256) {
    issues.push({ code: "total_sha", message: "totalSha256 در manifest نیست." });
  }

  let partsBytesSum = 0;
  for (const part of manifest.parts) {
    const entry = files.find((f) => f.name === part.name);
    if (!entry) {
      issues.push({ code: "part_missing", message: `قطعه ${part.name} روی MyFiles نیست.` });
      continue;
    }
    const remoteSize = Number(entry.file_size || 0);
    if (remoteSize !== part.bytes) {
      issues.push({
        code: "part_size",
        message: `حجم ${part.name}: remote=${remoteSize} expected=${part.bytes}`,
      });
    }
    partsBytesSum += part.bytes;
  }

  if (partsBytesSum !== manifest.totalBytes) {
    issues.push({
      code: "parts_sum",
      message: `جمع partها (${partsBytesSum}) با totalBytes (${manifest.totalBytes}) برابر نیست.`,
    });
  }

  return {
    setId,
    ok: issues.length === 0,
    mode: "remote",
    issues,
    manifest,
    remoteFiles: files.length,
    expectedParts: manifest.parts.length,
    totalBytes: manifest.totalBytes,
    totalSha256: manifest.totalSha256,
  };
}

/** Full check: download all parts, reassemble, verify sha256 + tar readability. */
export async function verifyGoldenBackupSetFull(setId: string): Promise<GoldenVerifyResult> {
  const remote = await verifyGoldenBackupSetRemote(setId);
  if (!remote.ok && remote.issues.some((i) => i.code === "not_found" || i.code === "manifest_missing")) {
    return { ...remote, mode: "full" };
  }

  const issues = [...remote.issues];
  const tempDir = path.join(process.cwd(), "data", ".golden-verify-temp");
  const tarPath = path.join(tempDir, `${setId}.tar`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    console.log("[golden-verify] downloading and reassembling:", setId);
    await downloadGoldenTarFromMyFiles(setId, tarPath);
    const stat = await fs.stat(tarPath);
    if (remote.totalBytes && Number(stat.size) !== remote.totalBytes) {
      issues.push({
        code: "reassembled_size",
        message: `حجم بازسازی‌شده ${stat.size} با manifest ${remote.totalBytes} فرق دارد.`,
      });
    }
    const tarReadable = await verifyTarReadable(tarPath);
    if (!tarReadable) {
      issues.push({ code: "tar_unreadable", message: "فایل tar بازسازی‌شده قابل خواندن نیست (خراب است)." });
    }
    return {
      ...remote,
      ok: issues.length === 0,
      mode: "full",
      issues,
      tarReadable,
    };
  } catch (err) {
    issues.push({
      code: "full_verify",
      message: err instanceof Error ? err.message : "تأیید کامل ناموفق بود.",
    });
    return { ...remote, ok: false, mode: "full", issues };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
