#!/usr/bin/env tsx
import { promises as fs } from "fs";
import path from "path";
import { readFileSync } from "fs";
import { readLocalMap, writeLocalMap, getMediaRootDir } from "../lib/media-center/local-map";
import { readMediaCenterStore, writeMediaCenterStore } from "../lib/media-center/store";
import type { MediaAssetRef } from "../lib/filesir/types";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-matroska": ".mkv",
};

function needsExt(name: string) {
  return !/\.[a-zA-Z0-9]{2,5}$/.test(name);
}

function patch(ref: MediaAssetRef | null | undefined, map: Awaited<ReturnType<typeof readLocalMap>>) {
  if (!ref?.entryId) return ref;
  const hit = map.entries[String(ref.entryId)];
  if (!hit) return ref;
  return { ...ref, localPath: hit.localPath, fileName: hit.fileName || ref.fileName, mime: ref.mime || hit.mime };
}

async function main() {
  const map = await readLocalMap();
  const root = getMediaRootDir();
  let renamed = 0;

  for (const [id, entry] of Object.entries(map.entries)) {
    if (!needsExt(entry.localPath)) continue;
    const mime = (entry.mime || "").split(";")[0].trim().toLowerCase();
    let ext = EXT[mime];
    if (!ext) {
      if (entry.kind === "video") ext = ".mp4";
      else if (entry.kind === "image") ext = ".jpg";
      else continue;
    }
    const oldAbs = path.join(root, entry.localPath);
    const newLocal = entry.localPath + ext;
    const newAbs = path.join(root, newLocal);
    try {
      await fs.access(oldAbs);
    } catch {
      continue;
    }
    try {
      await fs.access(newAbs);
      continue;
    } catch {
      /* ok */
    }
    await fs.rename(oldAbs, newAbs);
    entry.localPath = newLocal;
    if (needsExt(entry.fileName)) entry.fileName = entry.fileName + ext;
    map.entries[id] = entry;
    renamed += 1;
  }

  await writeLocalMap(map);
  const store = await readMediaCenterStore();
  store.cards = store.cards.map((c) => ({
    ...c,
    cover: patch(c.cover, map) ?? null,
    video: patch(c.video, map) ?? null,
    image: patch(c.image, map) ?? null,
    avatar: patch(c.avatar, map) ?? null,
  }));
  await writeMediaCenterStore(store);
  console.log(JSON.stringify({ renamed, map: Object.keys(map.entries).length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
