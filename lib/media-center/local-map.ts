import { promises as fs } from "fs";
import path from "path";
import { getDataDir, getProjectRoot } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media-center/local-url";

export type LocalMediaEntry = {
  localPath: string;
  fileName: string;
  mime?: string;
  kind: "image" | "video" | "other";
  bytes?: number;
  folderPath?: string;
};

export type FilesIrLocalMap = {
  version: 1;
  updatedAt: string;
  rootFolderId?: number;
  entries: Record<string, LocalMediaEntry>;
};

const MAP_PATH = () => path.join(getDataDir(), "filesir-local-map.json");

export { publicMediaUrl };

export function getMediaRootDir(): string {
  return path.join(getProjectRoot(), "public", "media");
}

export async function readLocalMap(): Promise<FilesIrLocalMap> {
  try {
    const raw = await fs.readFile(MAP_PATH(), "utf8");
    const parsed = JSON.parse(raw) as FilesIrLocalMap;
    return {
      version: 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      rootFolderId: parsed.rootFolderId,
      entries: parsed.entries || {},
    };
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), entries: {} };
  }
}

export async function writeLocalMap(map: FilesIrLocalMap) {
  await fs.mkdir(getDataDir(), { recursive: true });
  map.version = 1;
  map.updatedAt = new Date().toISOString();
  await fs.writeFile(MAP_PATH(), JSON.stringify(map, null, 2), "utf8");
}

export async function getLocalEntry(entryId: number): Promise<LocalMediaEntry | null> {
  if (!entryId) return null;
  const map = await readLocalMap();
  return map.entries[String(entryId)] || null;
}

export function absoluteMediaPath(localPath: string): string {
  const root = getMediaRootDir();
  const abs = path.resolve(root, localPath);
  if (!abs.startsWith(path.resolve(root) + path.sep) && abs !== path.resolve(root)) {
    throw new Error("Invalid media path");
  }
  return abs;
}

export async function localFileExists(localPath: string): Promise<boolean> {
  try {
    const abs = absoluteMediaPath(localPath);
    const st = await fs.stat(abs);
    return st.isFile();
  } catch {
    return false;
  }
}
