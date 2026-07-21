import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { ensureFolder } from "@/lib/filesir/client";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { categoryFolderId } from "@/lib/media-center/categories";
import { deleteCategoryFoldersFromMyFile } from "@/lib/media-center/myfile-delete";
import {
  deleteCategory,
  readMediaCenterStore,
  slugify,
  upsertCategory,
} from "@/lib/media-center/store";

export const runtime = "nodejs";

function isSection(v: string): v is MediaSection {
  return MEDIA_SECTIONS.some((s) => s.id === v);
}

export async function GET(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const section = new URL(request.url).searchParams.get("section");
  const store = await readMediaCenterStore();
  const categories = section && isSection(section)
    ? store.categories.filter((c) => c.section === section)
    : store.categories;

  return NextResponse.json({ ok: true, categories });
}

export async function POST(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  const section = String(body?.section || "");
  const name = String(body?.name || "").trim();
  const parentId = body?.parentId ? String(body.parentId) : null;
  if (!isSection(section) || !name) {
    return NextResponse.json({ message: "section و name الزامی است." }, { status: 400 });
  }

  try {
    const store = await readMediaCenterStore();
    const sectionFolderId = store.sectionFolderIds[section];
    if (!sectionFolderId) {
      return NextResponse.json({ message: "ابتدا «راه‌اندازی پوشه‌ها» را بزنید." }, { status: 400 });
    }

    const parentFolderId = categoryFolderId(store.categories, parentId, sectionFolderId);
    if (!parentFolderId) {
      return NextResponse.json({ message: "دسته والد یافت نشد." }, { status: 400 });
    }

    const slug = slugify(name);
    const folder = await ensureFolder(name, parentFolderId);
    const siblings = store.categories.filter(
      (c) => c.section === section && (c.parentId ?? null) === parentId,
    );

    const updated = await upsertCategory({
      section,
      name,
      slug,
      folderId: folder.id,
      parentId,
      sortOrder: siblings.length,
    });

    return NextResponse.json({
      ok: true,
      categories: updated.categories.filter((c) => c.section === section),
    });
  } catch (error) {
    return handleFilesIrError(error);
  }
}

/** Remove category from site and delete matching MyFile folders + linked cards. */
export async function DELETE(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id الزامی است." }, { status: 400 });

  try {
    const store = await readMediaCenterStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return NextResponse.json({ message: "دسته یافت نشد." }, { status: 404 });

    const cardsBefore = store.cards.length;
    let myFileFoldersDeleted = 0;

    const cfg = filesIrGuard();
    if (!(cfg instanceof Response)) {
      myFileFoldersDeleted = await deleteCategoryFoldersFromMyFile(store, id);
    }

    const updated = await deleteCategory(id);
    const removedCards = cardsBefore - updated.cards.length;

    return NextResponse.json({
      ok: true,
      categories: updated.categories,
      cards: updated.cards,
      myFileFoldersDeleted,
      removedCards,
      message:
        removedCards > 0
          ? `دسته، ${removedCards} کارت و ${myFileFoldersDeleted} پوشه MyFile حذف شد.`
          : `دسته و ${myFileFoldersDeleted} پوشه MyFile حذف شد.`,
    });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
