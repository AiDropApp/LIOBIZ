import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-media-guard";
import { MEDIA_SECTIONS, type MediaSection } from "@/lib/filesir/types";
import { categoryDiskRelPath } from "@/lib/media-center/category-path-utils";
import { ensureLocalCategoryDir } from "@/lib/media-center/local-categories";
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

    if (parentId) {
      const parent = store.categories.find((c) => c.id === parentId && c.section === section);
      if (!parent) {
        return NextResponse.json({ message: "دسته والد یافت نشد." }, { status: 400 });
      }
    }

    const slug = slugify(name);
    const siblings = store.categories.filter(
      (c) => c.section === section && (c.parentId ?? null) === parentId,
    );

    const tempId = `temp-${Date.now()}`;
    const tempCats = [
      ...store.categories,
      {
        id: tempId,
        section,
        name,
        slug,
        folderId: 0,
        parentId,
        sortOrder: siblings.length,
        createdAt: new Date().toISOString(),
      },
    ];

    const diskRel = categoryDiskRelPath(tempCats, tempId);
    if (!diskRel) {
      return NextResponse.json({ message: "مسیر دسته ساخته نشد." }, { status: 400 });
    }

    await ensureLocalCategoryDir(diskRel);

    const updated = await upsertCategory({
      section,
      name,
      slug,
      folderId: 0,
      parentId,
      sortOrder: siblings.length,
    });

    return NextResponse.json({
      ok: true,
      categories: updated.categories.filter((c) => c.section === section),
      diskPath: diskRel,
      message: `دسته «${name}» روی سرور ایجاد شد.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطا در ایجاد دسته";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

/** Remove category from metadata only — files and cards are preserved. */
export async function DELETE(request: Request) {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id الزامی است." }, { status: 400 });

  try {
    const store = await readMediaCenterStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return NextResponse.json({ message: "دسته یافت نشد." }, { status: 404 });

    const updated = await deleteCategory(id);
    const unlinkedCards = store.cards.filter((c) => c.categoryId === id).length;

    return NextResponse.json({
      ok: true,
      categories: updated.categories,
      cards: updated.cards,
      message:
        unlinkedCards > 0
          ? `دسته از سایت حذف شد. ${unlinkedCards} کارت بدون تغییر فایل باقی ماند.`
          : "دسته از سایت حذف شد. فایل‌ها روی سرور دست‌نخورده باقی ماندند.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطا در حذف دسته";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
