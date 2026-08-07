import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { hasLocalMediaFiles } from "@/lib/media-center/local-library";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { syncLocalMediaCenter } from "@/lib/media-center/sync-local";

export const runtime = "nodejs";

function isSection(v: string | null): v is MediaSection {
  return Boolean(v && MEDIA_SECTIONS.some((s) => s.id === v));
}

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const section = new URL(request.url).searchParams.get("section");
  const store = await readMediaCenterStore();
  const localReady = await hasLocalMediaFiles();

  // Ensure storage is always local for media center
  if (store.storageMode !== "local") {
    store.storageMode = "local";
  }

  const categories = isSection(section)
    ? store.categories.filter((c) => c.section === section)
    : store.categories;
  const cards = isSection(section) ? store.cards.filter((c) => c.section === section) : store.cards;

  const bootstrapped = localReady || store.cards.length > 0 || store.categories.length > 0;

  return NextResponse.json({
    ok: true,
    configured: true,
    storageMode: "local",
    localReady,
    bootstrapped,
    store: {
      storageMode: "local",
    },
    categories,
    cards,
  });
}

/** Auto-sync categories from disk on init when requested */
export async function POST() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  try {
    const result = await syncLocalMediaCenter();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "همگام‌سازی ناموفق";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
