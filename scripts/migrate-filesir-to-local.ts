#!/usr/bin/env tsx
/**
 * Full Files.ir (My Files) → local disk migration.
 * Preserves folder names under public/media/, writes filesir-local-map.json,
 * and patches media-center.json assets with localPath.
 *
 * Usage (on server):
 *   cd /var/www/liobiz && pnpm media:migrate
 *   cd /var/www/liobiz && pnpm media:migrate -- --dry-run
 */
import { createWriteStream, readFileSync } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { getFilesIrToken } from "../lib/filesir/auth";
import { FILESIR_API_BASE } from "../lib/filesir/config";
import { listFileEntries } from "../lib/filesir/client";
import type { FilesIrFileEntry, MediaAssetRef, MediaCard } from "../lib/filesir/types";
import {
  getMediaRootDir,
  readLocalMap,
  writeLocalMap,
  type FilesIrLocalMap,
  type LocalMediaEntry,
} from "../lib/media-center/local-map";
import { readMediaCenterStore, writeMediaCenterStore } from "../lib/media-center/store";
import { snapshotJsonFile } from "../lib/json-snapshot";
import { getDataDir } from "../lib/paths";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = Math.max(1, Number(process.env.MIGRATE_CONCURRENCY || 2));
const MAX_DEPTH = 20;

function safeSegment(name: string): string {
  const cleaned = name
    .replace(/[<>:"|?*\x00-\x1f\\]/g, "_")
    .replace(/^\.+$/, "_")
    .trim();
  return cleaned || "unnamed";
}

function entryKind(entry: FilesIrFileEntry): "image" | "video" | "other" {
  if (entry.type === "image") return "image";
  if (entry.type === "video") return "video";
  if (entry.mime?.startsWith("image/")) return "image";
  if (entry.mime?.startsWith("video/")) return "video";
  return "other";
}

type WalkItem = {
  entry: FilesIrFileEntry;
  folderPath: string;
};

async function walkTree(folderId: number, folderPath: string, out: WalkItem[], depth = 0) {
  if (depth > MAX_DEPTH) return;
  let entries: FilesIrFileEntry[] = [];
  try {
    entries = await listFileEntries({ parentIds: [folderId], perPage: 200 });
  } catch (err) {
    console.error(`[walk] failed folder ${folderId} (${folderPath}):`, err);
    return;
  }

  for (const entry of entries) {
    if (entry.type === "folder") {
      const childPath = folderPath ? `${folderPath}/${safeSegment(entry.name)}` : safeSegment(entry.name);
      await walkTree(entry.id, childPath, out, depth + 1);
      continue;
    }
    if (entry.type !== "image" && entry.type !== "video") continue;
    out.push({ entry, folderPath });
  }
}

function extensionFor(entry: FilesIrFileEntry, kind: "image" | "video" | "other"): string {
  const name = entry.file_name || entry.name || "";
  if (/\.[a-zA-Z0-9]{2,5}$/.test(name)) return "";
  const mime = (entry.mime || "").split(";")[0].trim().toLowerCase();
  const byMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  if (byMime[mime]) return byMime[mime];
  if (kind === "video") return ".mp4";
  if (kind === "image") return ".jpg";
  return "";
}

async function downloadEntry(entry: FilesIrFileEntry, destAbs: string): Promise<number> {
  await fs.mkdir(path.dirname(destAbs), { recursive: true });
  const token = await getFilesIrToken();
  const res = await fetch(`${FILESIR_API_BASE}/file-entries/${entry.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream, */*",
    },
    redirect: "follow",
  });
  if (!res.ok || !res.body) {
    throw new Error(`download ${entry.id} failed: HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(`download ${entry.id} returned HTML (auth/token issue)`);
  }

  const tmp = `${destAbs}.part`;
  const nodeStream = Readable.fromWeb(res.body as import("stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(tmp));
  await fs.rename(tmp, destAbs);
  const st = await fs.stat(destAbs);
  return st.size;
}

async function mapPool<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function patchAsset(ref: MediaAssetRef | null | undefined, map: FilesIrLocalMap): MediaAssetRef | null | undefined {
  if (!ref?.entryId) return ref;
  const hit = map.entries[String(ref.entryId)];
  if (!hit) return ref;
  return { ...ref, localPath: hit.localPath, fileName: ref.fileName || hit.fileName, mime: ref.mime || hit.mime };
}

function patchCard(card: MediaCard, map: FilesIrLocalMap): MediaCard {
  return {
    ...card,
    cover: patchAsset(card.cover, map) ?? null,
    video: patchAsset(card.video, map) ?? null,
    image: patchAsset(card.image, map) ?? null,
    avatar: patchAsset(card.avatar, map) ?? null,
  };
}

async function main() {
  console.log(`[migrate] dryRun=${DRY_RUN} concurrency=${CONCURRENCY}`);
  const store = await readMediaCenterStore();
  const rootId = store.rootFolderId;
  if (!rootId) {
    throw new Error("rootFolderId missing in media-center.json — open admin media bootstrap first");
  }

  await snapshotJsonFile(path.join(getDataDir(), "media-center.json"), "media-center");
  await snapshotJsonFile(path.join(getDataDir(), "site-content.json"), "site-content");

  console.log(`[migrate] scanning Files.ir tree from rootFolderId=${rootId} ...`);
  const items: WalkItem[] = [];
  await walkTree(rootId, "", items);
  console.log(`[migrate] found ${items.length} image/video files`);

  const map = await readLocalMap();
  map.rootFolderId = rootId;
  const mediaRoot = getMediaRootDir();
  await fs.mkdir(mediaRoot, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  await mapPool(items, CONCURRENCY, async ({ entry, folderPath }, index) => {
    const kind = entryKind(entry);
    const ext = extensionFor(entry, kind);
    const baseName = safeSegment(entry.file_name || entry.name);
    const fileName = /\.[a-zA-Z0-9]{2,5}$/.test(baseName) ? baseName : `${baseName}${ext}`;
    const localPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const destAbs = path.join(mediaRoot, localPath);

    const existing = map.entries[String(entry.id)];
    try {
      if (existing?.localPath) {
        const abs = path.join(mediaRoot, existing.localPath);
        const st = await fs.stat(abs).catch(() => null);
        if (st?.isFile() && st.size > 0) {
          skipped += 1;
          if ((index + 1) % 25 === 0) {
            console.log(`[migrate] progress ${index + 1}/${items.length} (skip existing)`);
          }
          return;
        }
      }

      const st = await fs.stat(destAbs).catch(() => null);
      if (st?.isFile() && st.size > 0) {
        const meta: LocalMediaEntry = {
          localPath,
          fileName,
          mime: entry.mime,
          kind,
          bytes: st.size,
          folderPath,
        };
        map.entries[String(entry.id)] = meta;
        skipped += 1;
        return;
      }

      if (DRY_RUN) {
        console.log(`[dry-run] would download #${entry.id} -> ${localPath}`);
        map.entries[String(entry.id)] = { localPath, fileName, mime: entry.mime, kind, folderPath };
        downloaded += 1;
        return;
      }

      const size = await downloadEntry(entry, destAbs);
      map.entries[String(entry.id)] = {
        localPath,
        fileName,
        mime: entry.mime,
        kind,
        bytes: size,
        folderPath,
      };
      downloaded += 1;
      bytes += size;
      console.log(
        `[migrate] ${downloaded + skipped}/${items.length} OK #${entry.id} ${localPath} (${(size / 1024 / 1024).toFixed(1)}MB)`,
      );

      // Persist map incrementally so crashes don't lose progress
      if (downloaded % 5 === 0) {
        await writeLocalMap(map);
      }
    } catch (err) {
      failed += 1;
      console.error(`[migrate] FAIL #${entry.id} ${localPath}:`, err);
    }
  });

  if (!DRY_RUN) {
    await writeLocalMap(map);
  }

  // Patch media-center cards with localPath
  const patchedCards = store.cards.map((c) => patchCard(c, map));
  const patchedCount = patchedCards.filter((c) =>
    [c.cover, c.video, c.image, c.avatar].some((a) => a?.localPath),
  ).length;

  if (!DRY_RUN) {
    store.cards = patchedCards;
    await writeMediaCenterStore(store);
  }

  const report = {
    dryRun: DRY_RUN,
    totalFound: items.length,
    downloaded,
    skippedExisting: skipped,
    failed,
    bytesDownloaded: bytes,
    gbDownloaded: Number((bytes / 1024 / 1024 / 1024).toFixed(3)),
    mapEntries: Object.keys(map.entries).length,
    cardsPatchedWithLocal: patchedCount,
    mediaRoot,
  };
  console.log("[migrate] DONE", JSON.stringify(report, null, 2));

  const reportPath = path.join(getDataDir(), "filesir-migrate-report.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
}

main().catch((err) => {
  console.error("[migrate] fatal:", err);
  process.exit(1);
});
