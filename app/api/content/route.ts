import { NextResponse } from "next/server";
import { readPublicSiteContent } from "@/lib/content-store";
import { parseAuthCookie } from "@/lib/auth-session";
import { isVerifiedAdminSession, toPublicApiContent } from "@/lib/public-content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = parseAuthCookie(request.headers.get("cookie"));
    const content = await readPublicSiteContent();
    const payload = isVerifiedAdminSession(session) ? content : toPublicApiContent(content);
    return NextResponse.json(payload, {
      headers: {
        // Avoid stale portfolio titles after media-center edits.
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/content] GET failed:", error);
    return NextResponse.json({ message: "خطا در بارگذاری محتوا" }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  const session = parseAuthCookie(request.headers.get("cookie"));
  if (!isVerifiedAdminSession(session)) {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
