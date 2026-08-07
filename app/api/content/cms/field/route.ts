import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-media-guard";
import { isAllowedCmsPath, setByPath } from "@/lib/cms-field-path";
import { syncCmsFieldToMediaCenter } from "@/lib/cms-media-sync";
import { sanitizeFieldValue } from "@/lib/cms-field-sanitize";
import { readSiteContent, writeSiteContent } from "@/lib/content-store";
import { isVideoUrl } from "@/lib/media-types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.trim() : "";
  if (!path || !isAllowedCmsPath(path)) {
    return NextResponse.json({ message: "مسیر فیلد نامعتبر است." }, { status: 400 });
  }

  const value = sanitizeFieldValue(path, body?.value);

  const current = await readSiteContent();
  let next = setByPath(current, path, value);

  if (path === "landing.heroMediaUrl" && typeof value === "string") {
    const url = value.trim();
    next = setByPath(next, "landing.heroMediaType", isVideoUrl(url) ? "video" : "image");
  }

  await writeSiteContent(next);
  await syncCmsFieldToMediaCenter(path, value).catch(() => undefined);
  return NextResponse.json({ ok: true, path, value, content: next });
}
