import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError, isAllowedUploadMime } from "@/lib/admin-media-guard";
import { initUpload, uploadSimple } from "@/lib/filesir/client";
import type { MediaSection } from "@/lib/filesir/types";
import { readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const section = form.get("section") ? (String(form.get("section")) as MediaSection) : undefined;
      const categoryFolderId = form.get("categoryFolderId")
        ? Number(form.get("categoryFolderId"))
        : undefined;

      if (!(file instanceof File)) {
        return NextResponse.json({ message: "فایل ارسال نشده." }, { status: 400 });
      }
      if (!isAllowedUploadMime(file.type || "application/octet-stream")) {
        return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
      }

      const parentId = categoryFolderId ?? (section ? (await readMediaCenterStore()).sectionFolderIds[section] : null);
      const result = await uploadSimple(file, file.name, parentId ?? null);
      return NextResponse.json({ ok: true, mode: "simple", fileEntry: result.fileEntry });
    }

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
