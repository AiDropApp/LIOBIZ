import { NextResponse } from "next/server";
import { readSiteContent } from "@/lib/content-store";
import { parseAuthCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const content = await readSiteContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("[api/content] GET failed:", error);
    return NextResponse.json({ message: "خطا در بارگذاری محتوا" }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  const session = parseAuthCookie(request.headers.get("cookie"));
  if (!session || session.role !== "admin") {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
