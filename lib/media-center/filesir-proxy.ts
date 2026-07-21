import { NextResponse } from "next/server";
import { getFilesIrToken } from "@/lib/filesir/auth";
import { isFilesIrConfigured } from "@/lib/filesir/config";

function forwardHeaders(source: Response, contentType?: string, thumb = false): Headers {
  const headers = new Headers();
  const passthrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ] as const;

  for (const name of passthrough) {
    const value = source.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (!headers.has("content-type") && contentType) {
    headers.set("content-type", contentType);
  }

  headers.set("Cache-Control", thumb ? "private, max-age=3600, stale-while-revalidate=86400" : "private, max-age=300, stale-while-revalidate=600");
  return headers;
}

export async function proxyFilesIrEntry(request: Request, entryId: number): Promise<Response> {
  if (!isFilesIrConfigured()) {
    return NextResponse.json({ message: "Files.ir پیکربندی نشده." }, { status: 503 });
  }

  if (!entryId) {
    return NextResponse.json({ message: "entryId نامعتبر" }, { status: 400 });
  }

  const url = new URL(request.url);
  const thumb = url.searchParams.get("thumb") === "1";
  const range = request.headers.get("range");

  try {
    const token = await getFilesIrToken();
    const qs = thumb ? "?thumbnail=1" : "";
    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream, */*",
    };
    if (range) upstreamHeaders.Range = range;

    const res = await fetch(
      `${process.env.FILESIR_API_BASE || "https://my.files.ir/api/v1"}/file-entries/${entryId}${qs}`,
      {
        headers: upstreamHeaders,
        redirect: "follow",
      },
    );

    if (!res.ok) {
      return NextResponse.json({ message: "فایل یافت نشد." }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { message: "دسترسی Files.ir نامعتبر است. توکن API را در .env.local بررسی کنید." },
        { status: 502 },
      );
    }

    const fallbackType = thumb ? "image/jpeg" : "application/octet-stream";
    const headers = forwardHeaders(res, res.headers.get("content-type") || fallbackType, thumb);

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch {
    return NextResponse.json({ message: "خطا در بارگذاری فایل." }, { status: 500 });
  }
}
