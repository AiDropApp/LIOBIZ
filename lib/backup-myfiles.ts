import { readFile } from "fs/promises";
import path from "path";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import {
  deleteEntries,
  ensureFolder,
  findLiobizRootFolder,
  listFileEntries,
  uploadSimple,
} from "@/lib/filesir/client";
import type { FilesIrFileEntry } from "@/lib/filesir/types";
import { getBackupPath } from "@/lib/backup";

export const BACKUP_FOLDER_NAME = "backup";
export const MAX_MYFILES_BACKUPS = Number(process.env.BACKUP_MYFILES_RETAIN || 3);

function myFilesBackupEnabled(): boolean {
  if (process.env.BACKUP_MYFILES_ENABLED === "false") return false;
  return isFilesIrConfigured();
}

async function ensureBackupFolder(): Promise<number> {
  const root = await findLiobizRootFolder();
  if (!root) {
    const created = await ensureFolder("Liobiz", null);
    const folder = await ensureFolder(BACKUP_FOLDER_NAME, created.id);
    return folder.id;
  }
  const folder = await ensureFolder(BACKUP_FOLDER_NAME, root.id);
  return folder.id;
}

function backupZipEntries(entries: FilesIrFileEntry[]): FilesIrFileEntry[] {
  return entries.filter(
    (entry) => entry.type !== "folder" && entry.name.endsWith(".zip") && entry.name.startsWith("backup-"),
  );
}

function sortByNewest(entries: FilesIrFileEntry[]): FilesIrFileEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = Date.parse(a.created_at || "") || 0;
    const bTime = Date.parse(b.created_at || "") || 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.name.localeCompare(a.name);
  });
}

export async function rotateMyFilesBackups(folderId: number) {
  const entries = await listFileEntries({ parentIds: [folderId], perPage: 100 });
  const zips = sortByNewest(backupZipEntries(entries));
  const toDelete = zips.slice(MAX_MYFILES_BACKUPS);
  if (!toDelete.length) return { deleted: 0 };

  await deleteEntries(
    toDelete.map((entry) => entry.id),
    false,
  );
  return { deleted: toDelete.length };
}

export async function uploadBackupToMyFiles(filename: string) {
  if (!myFilesBackupEnabled()) {
    return { skipped: true as const, reason: "myfiles_not_configured" };
  }

  const folderId = await ensureBackupFolder();
  const filePath = getBackupPath(filename);
  const buffer = await readFile(filePath);
  const blob = new Blob([buffer], { type: "application/zip" });

  const uploaded = await uploadSimple(blob, path.basename(filename), folderId);
  const rotated = await rotateMyFilesBackups(folderId);

  return {
    skipped: false as const,
    entryId: uploaded.fileEntry.id,
    filename: uploaded.fileEntry.name,
    remoteDeleted: rotated.deleted,
  };
}
