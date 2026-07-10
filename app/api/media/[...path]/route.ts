import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  zip: "application/zip",
};

const ALLOWED_FOLDERS = ["portfolio", "backstage", "hero", "orders", "uploads"];

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path || [];
  if (segments.length < 2) {
    return NextResponse.json({ message: "مسیر نامعتبر" }, { status: 400 });
  }

  const [folder, ...rest] = segments;
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ message: "پوشه نامعتبر" }, { status: 400 });
  }

  const filename = rest.join("/");
  if (!filename || filename.includes("..") || path.isAbsolute(filename)) {
    return NextResponse.json({ message: "نام فایل نامعتبر" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", folder, filename);

  try {
    const data = await fs.readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "فایل پیدا نشد" }, { status: 404 });
  }
}
