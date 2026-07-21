import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { deleteEntries, moveEntries } from "@/lib/filesir/client";
import { deleteCardsByEntryIds, readMediaCenterStore } from "@/lib/media-center/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  const body = await request.json().catch(() => null);
  const action = String(body?.action || "");

  try {
    if (action === "delete") {
      const entryIds = Array.isArray(body?.entryIds) ? body.entryIds.map(Number) : [];
      if (!entryIds.length) {
        return NextResponse.json({ message: "entryIds الزامی است." }, { status: 400 });
      }

      const before = await readMediaCenterStore();
      const cardsBefore = before.cards.length;

      await deleteEntries(entryIds, Boolean(body?.deleteForever));
      const store = await deleteCardsByEntryIds(entryIds);
      const removedCardCount = cardsBefore - store.cards.length;

      return NextResponse.json({
        ok: true,
        removedCardCount,
        message:
          removedCardCount > 0
            ? `فایل از MyFile حذف شد و ${removedCardCount} کارت از سایت پاک شد.`
            : "فایل از MyFile حذف شد.",
      });
    }

    if (action === "move") {
      const entryIds = Array.isArray(body?.entryIds) ? body.entryIds.map(Number) : [];
      const destinationId = body?.destinationId != null ? Number(body.destinationId) : null;
      if (!entryIds.length) {
        return NextResponse.json({ message: "entryIds الزامی است." }, { status: 400 });
      }
      const result = await moveEntries(entryIds, destinationId);
      return NextResponse.json({ ok: true, entries: result.entries });
    }

    return NextResponse.json({ message: "action نامعتبر" }, { status: 400 });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
