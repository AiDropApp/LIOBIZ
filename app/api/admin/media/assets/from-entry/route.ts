import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import type { MediaAssetRef } from "@/lib/filesir/types";
import { getLocalEntry } from "@/lib/media-center/local-map";
import { publicMediaUrl } from "@/lib/media-center/local-url";

export const runtime = "nodejs";

function entryKindFromMeta(opts: {
  type?: string;
  mime?: string;
  name?: string;
}): "image" | "video" | "other" {
  if (opts.type === "video" || opts.mime?.startsWith("video/")) return "video";
  if (opts.type === "image" || opts.mime?.startsWith("image/")) return "image";
  const ext = (opts.name || "").split(".").pop()?.toLowerCase();
  if (ext && ["mp4", "webm", "mov", "mkv", "m4v"].includes(ext)) return "video";
  if (ext && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return "image";
  return "other";
}

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const entryId = Number(body?.entryId);
  if (!entryId) {
    return NextResponse.json({ message: "entryId الزامی است." }, { status: 400 });
  }

  try {
    const localPath = typeof body?.localPath === "string" ? body.localPath.trim() : "";
    const mapped = await getLocalEntry(entryId);
    const path = localPath || mapped?.localPath || "";
    if (!path) {
      return NextResponse.json({ message: "این فایل روی سرور پیدا نشد." }, { status: 404 });
    }

    const kind =
      body?.type === "video" || mapped?.kind === "video"
        ? "video"
        : body?.type === "image" || mapped?.kind === "image"
          ? "image"
          : entryKindFromMeta({
              type: body?.type || mapped?.kind,
              mime: body?.mime || mapped?.mime,
              name: String(body?.fileName || mapped?.fileName || "file"),
            });
    const asset: MediaAssetRef = {
      entryId,
      shareUrl: publicMediaUrl(path),
      mime: body?.mime || mapped?.mime,
      fileName: String(body?.fileName || mapped?.fileName || path.split("/").pop() || "file"),
      kind,
      localPath: path,
    };
    return NextResponse.json({ ok: true, asset, storageMode: "local" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "اتصال فایل ناموفق";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
