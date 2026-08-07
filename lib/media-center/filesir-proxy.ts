import { NextResponse } from "next/server";
import { getFilesIrToken } from "@/lib/filesir/auth";
import { isFilesIrConfigured } from "@/lib/filesir/config";
import {
  absoluteMediaPath,
  getLocalEntry,
  localFileExists,
  publicMediaUrl,
} from "@/lib/media-center/local-map";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

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

  headers.set(
    "Cache-Control",
    thumb
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "public, max-age=2592000, stale-while-revalidate=86400",
  );
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

async function serveLocalFile(request: Request, localPath: string, mimeHint?: string): Promise<Response> {
  const abs = absoluteMediaPath(localPath);
  const st = await stat(abs);
  const ext = localPath.split(".").pop()?.toLowerCase() || "";
  const contentType = mimeHint || MIME[ext] || "application/octet-stream";
  const range = request.headers.get("range");

  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : st.size - 1;
      if (start >= st.size || end >= st.size || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${st.size}` },
        });
      }
      const stream = createReadStream(abs, { start, end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${st.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=2592000, immutable",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  const stream = createReadStream(abs);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(st.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=2592000, immutable",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function proxyFilesIrEntry(request: Request, entryId: number): Promise<Response> {
  if (!entryId) {
    return NextResponse.json({ message: "entryId نامعتبر" }, { status: 400 });
  }

  const url = new URL(request.url);
  const thumb = url.searchParams.get("thumb") === "1";
  const local = await getLocalEntry(entryId);

  // Prefer local disk: redirect so nginx/Cloudflare can cache and Node stays light.
  if (local?.localPath && (await localFileExists(local.localPath))) {
    // Video thumbs may not exist locally — fall through to Files.ir for thumbnails only.
    if (!(thumb && local.kind === "video")) {
      if (url.searchParams.get("direct") === "1") {
        return serveLocalFile(request, local.localPath, local.mime);
      }
      const target = new URL(publicMediaUrl(local.localPath), url.origin);
      return NextResponse.redirect(target, 302);
    }
  }

  if (!isFilesIrConfigured()) {
    return NextResponse.json({ message: "Files.ir پیکربندی نشده." }, { status: 503 });
  }

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
