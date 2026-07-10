import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import {
  readSiteContent,
  writeSiteContent,
  type BackstageItem,
  type PortfolioItem,
} from "@/lib/content-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  return session?.role === "admin";
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as "portfolio" | "backstage" | undefined;
  const content = await readSiteContent();

  if (type === "portfolio") {
    const item: PortfolioItem = {
      id: Date.now(),
      title: String(body?.title || "پروژه جدید").trim(),
      category: String(body?.category || "برندینگ").trim(),
      image: String(body?.image || "/images/project1.svg"),
      description: String(body?.description || "").trim() || undefined,
      client: String(body?.client || "").trim() || undefined,
      year: String(body?.year || "").trim() || undefined,
    };
    content.portfolio = [item, ...content.portfolio];
  } else if (type === "backstage") {
    const item: BackstageItem = {
      id: Date.now(),
      caption: String(body?.caption || "بک‌استیج جدید").trim(),
      image: String(body?.image || "/images/backstage1.svg"),
    };
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

  if (type === "portfolio") {
    content.portfolio = content.portfolio.map((item) =>
      item.id === id
        ? {
            ...item,
            title: String(body?.title ?? item.title).trim(),
            category: String(body?.category ?? item.category).trim(),
            image: String(body?.image ?? item.image),
            description:
              body?.description !== undefined
                ? String(body.description).trim() || undefined
                : item.description,
            client:
              body?.client !== undefined
                ? String(body.client).trim() || undefined
                : item.client,
            year:
              body?.year !== undefined
                ? String(body.year).trim() || undefined
                : item.year,
          }
        : item,
    );
  } else if (type === "backstage") {
    content.backstage = content.backstage.map((item) =>
      item.id === id
        ? {
            ...item,
            caption: String(body?.caption ?? item.caption).trim(),
            image: String(body?.image ?? item.image),
          }
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
