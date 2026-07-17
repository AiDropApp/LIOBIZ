import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import {
  readSiteContent,
  writeSiteContent,
  type BackstageItem,
  type PortfolioItem,
} from "@/lib/content-store";
import { normalizeMediaFields, type MediaAspect, type MediaKind } from "@/lib/media-types";
import { sortCategories, type PortfolioCategory } from "@/lib/portfolio";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  return session?.role === "admin";
}

function mediaFromBody(body: Record<string, unknown>) {
  return normalizeMediaFields({
    image: String(body?.image || ""),
    videoSrc: body?.videoSrc ? String(body.videoSrc) : undefined,
    mediaKind: body?.mediaKind as MediaKind | undefined,
    aspectRatio: body?.aspectRatio as MediaAspect | undefined,
  });
}

function resolvePortfolioCategory(
  content: Awaited<ReturnType<typeof readSiteContent>>,
  body: Record<string, unknown>,
  fallbackId?: string,
) {
  const categoryId = String(body?.categoryId || fallbackId || "").trim();
  const cat = content.portfolioCategories.find((c) => c.id === categoryId);
  if (cat) return cat;
  return content.portfolioCategories[0] || null;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = body?.type as "portfolio" | "backstage" | "portfolio-category" | undefined;
  const content = await readSiteContent();
  const media = mediaFromBody(body || {});

  if (type === "portfolio-category") {
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ message: "نام دسته الزامی است" }, { status: 400 });
    }
    const item: PortfolioCategory = {
      id: `cat-${Date.now()}`,
      name,
      coverImage: body?.coverImage ? String(body.coverImage).trim() || undefined : undefined,
      order: content.portfolioCategories.length,
    };
    content.portfolioCategories = sortCategories([...content.portfolioCategories, item]);
  } else if (type === "portfolio") {
    const cat = resolvePortfolioCategory(content, body || {});
    if (!cat) {
      return NextResponse.json({ message: "ابتدا یک دسته بسازید" }, { status: 400 });
    }
    const needsVideo = media.mediaKind === "video";
    if (!String(body?.title || "").trim()) {
      return NextResponse.json({ message: "عنوان الزامی است" }, { status: 400 });
    }
    if (!media.image) {
      return NextResponse.json({ message: "کاور / تصویر کارت الزامی است" }, { status: 400 });
    }
    if (needsVideo && !media.videoSrc) {
      return NextResponse.json({ message: "لینک یا فایل ویدیو الزامی است" }, { status: 400 });
    }

    const item: PortfolioItem = normalizeMediaFields({
      id: Date.now(),
      title: String(body?.title || "").trim(),
      categoryId: cat.id,
      category: cat.name,
      image: media.image || String(body?.image || ""),
      videoSrc: media.videoSrc,
      mediaKind: media.mediaKind,
      aspectRatio: media.aspectRatio,
      description: String(body?.description || "").trim() || undefined,
      client: String(body?.client || "").trim() || undefined,
      year: String(body?.year || "").trim() || undefined,
    });
    content.portfolio = [item, ...content.portfolio];
  } else if (type === "backstage") {
    const item: BackstageItem = normalizeMediaFields({
      id: Date.now(),
      caption: String(body?.caption || "بک‌استیج جدید").trim(),
      image: media.image || String(body?.image || "/images/backstage1.svg"),
      videoSrc: media.videoSrc,
      mediaKind: media.mediaKind,
      aspectRatio: media.aspectRatio,
    });
    content.backstage = [item, ...content.backstage];
  } else {
    return NextResponse.json({ message: "نوع نامعتبر" }, { status: 400 });
  }

  await writeSiteContent(content);
  return NextResponse.json({ ok: true, content });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = body?.type as "portfolio" | "backstage" | "portfolio-category" | undefined;
  const content = await readSiteContent();
  const media = mediaFromBody(body || {});

  if (type === "portfolio-category") {
    const id = String(body?.id || "").trim();
    const name = String(body?.name ?? "").trim();
    if (!id) return NextResponse.json({ message: "شناسه دسته نامعتبر است" }, { status: 400 });
    if (!name) return NextResponse.json({ message: "نام دسته الزامی است" }, { status: 400 });

    content.portfolioCategories = sortCategories(
      content.portfolioCategories.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              name,
              coverImage:
                body?.coverImage !== undefined
                  ? String(body.coverImage).trim() || undefined
                  : cat.coverImage,
              order:
                body?.order !== undefined && Number.isFinite(Number(body.order))
                  ? Number(body.order)
                  : cat.order,
            }
          : cat,
      ),
    );

    content.portfolio = content.portfolio.map((item) =>
      item.categoryId === id ? { ...item, category: name } : item,
    );
  } else if (type === "portfolio") {
    const id = Number(body?.id);
    const existing = content.portfolio.find((item) => item.id === id);
    if (!existing) {
      return NextResponse.json({ message: "آیتم یافت نشد" }, { status: 404 });
    }
    const cat = resolvePortfolioCategory(content, body || {}, existing.categoryId);
    if (!cat) {
      return NextResponse.json({ message: "دسته معتبر نیست" }, { status: 400 });
    }

    content.portfolio = content.portfolio.map((item) =>
      item.id === id
        ? normalizeMediaFields({
            ...item,
            title: String(body?.title ?? item.title).trim(),
            categoryId: cat.id,
            category: cat.name,
            image: body?.image !== undefined ? String(body.image) : item.image,
            videoSrc: body?.videoSrc !== undefined ? String(body.videoSrc) : item.videoSrc,
            mediaKind: (body?.mediaKind as MediaKind | undefined) ?? item.mediaKind,
            aspectRatio: (body?.aspectRatio as MediaAspect | undefined) ?? item.aspectRatio,
            description:
              body?.description !== undefined
                ? String(body.description).trim() || undefined
                : item.description,
            client:
              body?.client !== undefined
                ? String(body.client).trim() || undefined
                : item.client,
            year:
              body?.year !== undefined ? String(body.year).trim() || undefined : item.year,
          })
        : item,
    );
  } else if (type === "backstage") {
    const id = Number(body?.id);
    content.backstage = content.backstage.map((item) =>
      item.id === id
        ? normalizeMediaFields({
            ...item,
            caption: String(body?.caption ?? item.caption).trim(),
            image: body?.image !== undefined ? String(body.image) : item.image,
            videoSrc: body?.videoSrc !== undefined ? String(body.videoSrc) : item.videoSrc,
            mediaKind: (body?.mediaKind as MediaKind | undefined) ?? item.mediaKind,
            aspectRatio: (body?.aspectRatio as MediaAspect | undefined) ?? item.aspectRatio,
          })
        : item,
    );
  } else {
    return NextResponse.json({ message: "نوع نامعتبر" }, { status: 400 });
  }

  await writeSiteContent(content);
  return NextResponse.json({ ok: true, content });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = body?.type as "portfolio" | "backstage" | "portfolio-category" | undefined;
  const content = await readSiteContent();

  if (type === "portfolio-category") {
    const id = String(body?.id || "").trim();
    const inUse = content.portfolio.some((item) => item.categoryId === id);
    if (inUse) {
      return NextResponse.json(
        { message: "این دسته هنوز نمونه کار دارد؛ اول کارها را حذف یا جابه‌جا کنید" },
        { status: 400 },
      );
    }
    content.portfolioCategories = content.portfolioCategories.filter((cat) => cat.id !== id);
  } else if (type === "portfolio") {
    const id = Number(body?.id);
    content.portfolio = content.portfolio.filter((item) => item.id !== id);
  } else if (type === "backstage") {
    const id = Number(body?.id);
    content.backstage = content.backstage.filter((item) => item.id !== id);
  } else {
    return NextResponse.json({ message: "نوع نامعتبر" }, { status: 400 });
  }

  await writeSiteContent(content);
  return NextResponse.json({ ok: true, content });
}
