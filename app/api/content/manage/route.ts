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

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as "portfolio" | "backstage" | undefined;
  const content = await readSiteContent();
  const media = mediaFromBody(body || {});

  if (type === "portfolio") {
    const item: PortfolioItem = normalizeMediaFields({
      id: Date.now(),
      title: String(body?.title || "پروژه جدید").trim(),
      category: String(body?.category || "برندینگ").trim(),
      image: media.image || String(body?.image || "/images/project1.svg"),
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

  const body = await request.json().catch(() => null);
  const type = body?.type as "portfolio" | "backstage" | undefined;
  const id = Number(body?.id);
  const content = await readSiteContent();
  const media = mediaFromBody(body || {});

  if (type === "portfolio") {
    content.portfolio = content.portfolio.map((item) =>
      item.id === id
        ? normalizeMediaFields({
            ...item,
            title: String(body?.title ?? item.title).trim(),
            category: String(body?.category ?? item.category).trim(),
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

  const body = await request.json().catch(() => null);
  const type = body?.type as "portfolio" | "backstage" | undefined;
  const id = Number(body?.id);
  const content = await readSiteContent();

  if (type === "portfolio") {
    content.portfolio = content.portfolio.filter((item) => item.id !== id);
  } else if (type === "backstage") {
    content.backstage = content.backstage.filter((item) => item.id !== id);
  } else {
    return NextResponse.json({ message: "نوع نامعتبر" }, { status: 400 });
  }

  await writeSiteContent(content);
  return NextResponse.json({ ok: true, content });
}
