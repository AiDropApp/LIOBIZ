import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "general");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "فایل ارسال نشده است." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "فقط تصویر مجاز است." }, { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ message: "حداکثر حجم تصویر ۴ مگابایت است." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext) ? ext : "png";
  const folder = kind === "backstage" ? "backstage" : kind === "portfolio" ? "portfolio" : "uploads";
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);

  // Served via API so files uploaded after `next start` are still reachable.
  return NextResponse.json({
    ok: true,
    url: `/api/media/${folder}/${filename}`,
  });
}
