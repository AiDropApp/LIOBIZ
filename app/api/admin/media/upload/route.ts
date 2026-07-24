import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError, isAllowedUploadMime } from "@/lib/admin-media-guard";
import { initUpload, uploadSimple } from "@/lib/filesir/client";
import type { MediaSection } from "@/lib/filesir/types";
import { getMediaRootDir, readLocalMap, writeLocalMap } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { stableLocalEntryId } from "@/lib/media-center/local-library";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

function safeSegment(name: string): string {
  return name.replace(/[<>:"|?*\x00-\x1f\\]/g, "_").replace(/^\.+$/, "_").trim() || "unnamed";
}

function resolveParentId(body: {
  parentId?: number | null;
  section?: MediaSection;
  categoryFolderId?: number | null;
}) {
  if (body.categoryFolderId) return body.categoryFolderId;
  if (body.parentId != null) return body.parentId;
  if (body.section) {
    return readMediaCenterStore().then((s) => s.sectionFolderIds[body.section!] ?? null);
  }
  return Promise.resolve(null);
}

async function saveLocalUpload(opts: {
  file: File;
  section?: MediaSection;
  categoryName?: string;
}) {
  const section = opts.section || "portfolio";
  const folder = opts.categoryName
    ? `${safeSegment(section)}/${safeSegment(opts.categoryName)}`
    : `${safeSegment(section)}/uploads`;
  const ext = path.extname(opts.file.name) || (opts.file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const base = safeSegment(path.basename(opts.file.name, path.extname(opts.file.name))) || randomUUID();
  const fileName = `${base}-${randomUUID().slice(0, 8)}${ext}`;
  const localPath = `${folder}/${fileName}`;
  const abs = path.join(getMediaRootDir(), localPath);
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
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const section = form.get("section") ? (String(form.get("section")) as MediaSection) : undefined;
      const categoryFolderId = form.get("categoryFolderId")
        ? Number(form.get("categoryFolderId"))
        : undefined;
      const categoryName = form.get("categoryName") ? String(form.get("categoryName")) : undefined;
      const formMode = form.get("storageMode") ? String(form.get("storageMode")) : undefined;
      const store = await readMediaCenterStore();
      const storageMode =
        formMode === "filesir" || formMode === "local"
          ? formMode
          : store.storageMode === "filesir"
            ? "filesir"
            : "local";

      if (!(file instanceof File)) {
        return NextResponse.json({ message: "فایل ارسال نشده." }, { status: 400 });
      }
      if (!isAllowedUploadMime(file.type || "application/octet-stream")) {
        return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
      }

      if (storageMode === "local") {
        const saved = await saveLocalUpload({ file, section, categoryName });
        return NextResponse.json({
          ok: true,
          mode: "local",
          fileEntry: saved.fileEntry,
          localPath: saved.localPath,
          publicUrl: saved.publicUrl,
        });
      }

      const cfg = filesIrGuard();
      if (cfg) return cfg;

      const parentId =
        categoryFolderId ?? (section ? store.sectionFolderIds[section] : null);
      const result = await uploadSimple(file, file.name, parentId ?? null);
      return NextResponse.json({ ok: true, mode: "simple", fileEntry: result.fileEntry });
    }

    const cfg = filesIrGuard();
    if (cfg) return cfg;

    const body = await request.json();
    const filename = String(body?.filename || "").trim();
    const size = Number(body?.size || 0);
    if (!filename || !size) {
      return NextResponse.json({ message: "filename و size الزامی است." }, { status: 400 });
    }

    const parentId = await resolveParentId(body);
    const init = await initUpload({ filename, size, parentId });
    return NextResponse.json({ ok: true, init });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
