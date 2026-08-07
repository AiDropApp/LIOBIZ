import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { hasLocalMediaFiles } from "@/lib/media-center/local-library";

export const runtime = "nodejs";

/** Media center is server-only; MyFile is reserved for platform backups. */
export async function GET() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  return NextResponse.json({
    ok: true,
    storageMode: "local",
    localReady: await hasLocalMediaFiles(),
  });
}

export async function PUT() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const store = await readMediaCenterStore();
  if (store.storageMode !== "local") {
    store.storageMode = "local";
    const { writeMediaCenterStore } = await import("@/lib/media-center/store");
    await writeMediaCenterStore(store);
  }

  return NextResponse.json({
    ok: true,
    storageMode: "local",
    message: "مرکز رسانه فقط از سرور محلی استفاده می‌کند.",
  });
}
