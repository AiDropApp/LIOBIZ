import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import { readMediaCenterStore, setMediaStorageMode } from "@/lib/media-center/store";
import { hasLocalMediaFiles } from "@/lib/media-center/local-library";

export const runtime = "nodejs";

export async function GET() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const store = await readMediaCenterStore();
  const mode = store.storageMode === "filesir" ? "filesir" : "local";
  return NextResponse.json({
    ok: true,
    storageMode: mode,
    filesirConfigured: isFilesIrConfigured(),
    localReady: await hasLocalMediaFiles(),
  });
}

export async function PUT(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const mode = body?.storageMode === "filesir" ? "filesir" : body?.storageMode === "local" ? "local" : null;
  if (!mode) {
    return NextResponse.json({ message: "storageMode باید local یا filesir باشد." }, { status: 400 });
  }

  if (mode === "filesir" && !isFilesIrConfigured()) {
    return NextResponse.json(
      { message: "مای‌فایل پیکربندی نشده. ابتدا FILESIR_ACCESS_TOKEN را تنظیم کنید." },
      { status: 503 },
    );
  }

  const store = await setMediaStorageMode(mode);
  return NextResponse.json({
    ok: true,
    storageMode: store.storageMode || "local",
  });
}
