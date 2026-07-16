import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { getDb, orderFiles } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "وارد شوید" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "general");
  const orderId = form.get("orderId") ? Number(form.get("orderId")) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "فایل ارسال نشده است." }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  const isDoc =
    file.type.includes("pdf") ||
    file.type.includes("zip") ||
    file.name.endsWith(".pdf") ||
    file.name.endsWith(".zip");

  if (kind === "hero" || kind === "video" || kind === "creative-partners") {
    if (!isVideo && !isImage) {
      return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
    }
    if (file.size > 40 * 1024 * 1024) {
      return NextResponse.json({ message: "حداکثر حجم فایل ۴۰ مگابایت است." }, { status: 400 });
    }
  } else if (kind === "about") {
    if (!isImage) {
      return NextResponse.json({ message: "فقط تصویر مجاز است." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ message: "حداکثر حجم تصویر ۸ مگابایت است." }, { status: 400 });
    }
  } else if (kind === "portfolio" || kind === "backstage") {
    if (!isVideo && !isImage) {
      return NextResponse.json({ message: "فقط تصویر یا ویدیو مجاز است." }, { status: 400 });
    }
    const max = isVideo ? 40 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > max) {
      return NextResponse.json({
        message: isVideo ? "حداکثر حجم ویدیو ۴۰ مگابایت است." : "حداکثر حجم تصویر ۸ مگابایت است.",
      }, { status: 400 });
    }
  } else if (kind === "delivery" || kind === "request") {
    if (!isImage && !isDoc && !isVideo) {
      return NextResponse.json({ message: "فرمت فایل مجاز نیست." }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ message: "حداکثر حجم فایل ۲۰ مگابایت است." }, { status: 400 });
    }
    if (session.role !== "admin" && kind === "delivery") {
      return NextResponse.json({ message: "فقط ادمین می‌تواند فایل تحویل آپلود کند." }, { status: 403 });
    }
  } else {
    if (session.role !== "admin") {
      return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
    }
    if (!isImage) {
      return NextResponse.json({ message: "فقط تصویر مجاز است." }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ message: "حداکثر حجم تصویر ۴ مگابایت است." }, { status: 400 });
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const folder =
    kind === "backstage"
      ? "backstage"
      : kind === "portfolio"
        ? "portfolio"
        : kind === "hero" || kind === "video"
          ? "hero"
          : kind === "about"
            ? "about"
            : kind === "creative-partners"
              ? "creative-partners"
              : kind === "delivery" || kind === "request"
                ? "orders"
                : "uploads";

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);
  const url = `/api/media/${folder}/${filename}`;

  if ((kind === "delivery" || kind === "request") && orderId) {
    getDb()
      .insert(orderFiles)
      .values({
        orderId,
        uploadedBy: session.userId,
        fileName: file.name,
        fileUrl: url,
        kind: kind === "request" ? "request" : "delivery",
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  return NextResponse.json({ ok: true, url, fileName: file.name });
}
