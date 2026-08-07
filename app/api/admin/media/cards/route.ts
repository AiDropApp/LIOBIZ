import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { deleteCardAssetsFromMyFile } from "@/lib/media-center/sync-prune";
import {
  deleteCard,
  readMediaCenterStore,
  upsertCard,
} from "@/lib/media-center/store";
import { clearAutoSeoCaption } from "@/lib/media-center/auto-seo";
import { syncCardAssetsToFolders } from "@/lib/media-center/sync-folders";

export const runtime = "nodejs";

function isSection(v: string): v is MediaSection {
  return MEDIA_SECTIONS.some((s) => s.id === v);
}

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const section = new URL(request.url).searchParams.get("section");
  const store = await readMediaCenterStore();
  const cards =
    section && isSection(section) ? store.cards.filter((c) => c.section === section) : store.cards;
  const categories =
    section && isSection(section)
      ? store.categories.filter((c) => c.section === section)
      : store.categories;

  return NextResponse.json({ ok: true, cards, categories });
}

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const section = String(body?.section || "");
  const title = String(body?.title || "").trim();
  if (!isSection(section) || !title) {
    return NextResponse.json({ message: "section و title الزامی است." }, { status: 400 });
  }

  const store = await upsertCard({
    section,
    title,
    categoryId: body?.categoryId ?? null,
    description: body?.description ?? "",
    caption: body?.caption ?? "",
    role: body?.role ?? "",
    city: body?.city ?? "",
    cover: body?.cover ?? null,
    video: body?.video ?? null,
    image: body?.image ?? null,
    avatar: body?.avatar ?? null,
    published: body?.published !== false,
    sortOrder: Number(body?.sortOrder ?? 0),
  });

  const saved = store.cards.find(
    (c) => c.section === section && c.title === title && c.sortOrder === Number(body?.sortOrder ?? 0),
  ) || store.cards[store.cards.length - 1];

  if (saved) {
    try {
      await syncCardAssetsToFolders(saved, store);
    } catch {
      /* Files.ir move optional if not configured mid-save */
    }
  }

  return NextResponse.json({
    ok: true,
    cards: store.cards.filter((c) => c.section === section),
  });
}

export async function PUT(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ message: "id الزامی است." }, { status: 400 });

  const current = await readMediaCenterStore();
  const existing = current.cards.find((c) => c.id === id);
  if (!existing) return NextResponse.json({ message: "کارت یافت نشد." }, { status: 404 });

  const store = await upsertCard({
    ...existing,
    title: String(body?.title ?? existing.title).trim(),
    description: typeof body?.description === "string" ? body.description : existing.description,
    caption: clearAutoSeoCaption(
      typeof body?.caption === "string" ? body.caption : existing.caption,
    ),
    categoryId: body?.categoryId !== undefined ? body.categoryId : existing.categoryId,
    role: typeof body?.role === "string" ? body.role : existing.role,
    city: typeof body?.city === "string" ? body.city : existing.city,
    cover: body?.cover !== undefined ? body.cover : existing.cover,
    video: body?.video !== undefined ? body.video : existing.video,
    image: body?.image !== undefined ? body.image : existing.image,
    avatar: body?.avatar !== undefined ? body.avatar : existing.avatar,
    published: body?.published !== undefined ? body.published !== false : existing.published,
    sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
    id,
    section: existing.section,
  });

  const saved = store.cards.find((c) => c.id === id);
  if (saved) {
    try {
      await syncCardAssetsToFolders(saved, store);
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ ok: true, card: saved, cards: store.cards });
}

export async function DELETE(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id الزامی است." }, { status: 400 });

  try {
    const current = await readMediaCenterStore();
    const existing = current.cards.find((c) => c.id === id);
    if (!existing) return NextResponse.json({ message: "کارت یافت نشد." }, { status: 404 });

    const cfg = filesIrGuard();
    if (!(cfg instanceof Response)) {
      await deleteCardAssetsFromMyFile(existing);
    }

    const store = await deleteCard(id);
    return NextResponse.json({
      ok: true,
      cards: store.cards,
      message: "کارت و فایل‌های MyFile مرتبط حذف شد.",
    });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
