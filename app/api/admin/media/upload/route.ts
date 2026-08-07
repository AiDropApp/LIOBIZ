import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { adminGuard, isAllowedUploadMime } from "@/lib/admin-media-guard";
import type { MediaSection } from "@/lib/filesir/types";
import { categoryDiskRelPath } from "@/lib/media-center/local-categories";
import { getMediaRootDir, readLocalMap, writeLocalMap, absoluteMediaPath } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { stableLocalEntryId } from "@/lib/media-center/local-library";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

function safeSegment(name: string): string {
  return name.replace(/[<>:"|?*\x00-\x1f\\]/g, "_").replace(/^\.+$/, "_").trim() || "unnamed";
}

async function saveLocalUpload(opts: {
  file: File;
  section?: MediaSection;
  categoryId?: string | null;
  categoryDiskPath?: string;
}) {
  const section = opts.section || "portfolio";
  let folder: string;

  if (opts.categoryDiskPath) {
    const normalized = opts.categoryDiskPath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalized.includes("..") || path.isAbsolute(normalized)) {
      throw new Error("مسیر دسته‌بندی نامعتبر است.");
    }
    folder = normalized;
  } else if (opts.categoryId) {
    const store = await readMediaCenterStore();
    const rel = categoryDiskRelPath(store.categories, opts.categoryId);
    folder = rel || `${safeSegment(section)}/uploads`;
  } else {
    folder = `${safeSegment(section)}/uploads`;
  }

  const ext = path.extname(opts.file.name) || (opts.file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const base = safeSegment(path.basename(opts.file.name, path.extname(opts.file.name))) || randomUUID();
  const fileName = `${base}-${randomUUID().slice(0, 8)}${ext}`;
  const localPath = `${folder}/${fileName}`;
  const abs = absoluteMediaPath(localPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const buf = Buffer.from(await opts.file.arrayBuffer());
  await fs.writeFile(abs, buf);

  const kind = opts.file.type.startsWith("video/")
    ? "video"
    : opts.file.type.startsWith("image/")
      ? "image"
      : "other";
  const entryId = stableLocalEntryId(localPath);
  const map = await readLocalMap();
  map.entries[String(entryId)] = {
    localPath,
    fileName,
    mime: opts.file.type || undefined,
    kind,
    bytes: buf.length,
    folderPath: folder,
  };
  await writeLocalMap(map);

  return {
    fileEntry: {
      id: entryId,
      name: fileName,
      mime: opts.file.type || undefined,
      type: kind,
      file_size: buf.length,
    },
    localPath,
    publicUrl: publicMediaUrl(localPath),
  };
}

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const contentType = request.headers.get("content-type") || "";

  try {
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "فقط آپلود multipart پشتیبانی می‌شود." }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const section = form.get("section") ? (String(form.get("section")) as MediaSection) : undefined;
    const categoryId = form.get("categoryId") ? String(form.get("categoryId")) : undefined;
    const categoryDiskPath = form.get("categoryDiskPath")
      ? String(form.get("categoryDiskPath"))
      : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "فایل ارسال نشده." }, { status: 400 });
    }
    if (!isAllowedUploadMime(file.type || "application/octet-stream")) {
      return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
    }

    const saved = await saveLocalUpload({ file, section, categoryId, categoryDiskPath });
    return NextResponse.json({
      ok: true,
      mode: "local",
      fileEntry: saved.fileEntry,
      localPath: saved.localPath,
      publicUrl: saved.publicUrl,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "آپلود ناموفق";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
