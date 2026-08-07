import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { syncLocalMediaCenter } from "@/lib/media-center/sync-local";
import { findMediaDuplicates } from "@/lib/media-center/duplicates";

export const runtime = "nodejs";

export async function POST() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  try {
    const result = await syncLocalMediaCenter();
    return NextResponse.json({
      ok: true,
      ...result,
      message: `همگام‌سازی انجام شد: ${result.categoriesAdded} دسته جدید، ${result.cardsLinked} کارت به دسته مرتبط شد.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "همگام‌سازی ناموفق";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function GET() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  try {
    const duplicates = await findMediaDuplicates();
    return NextResponse.json({ ok: true, duplicates, count: duplicates.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطا در بررسی تکراری‌ها";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
