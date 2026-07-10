import { NextResponse } from "next/server";
import { readSiteContent } from "@/lib/content-store";
import { parseAuthCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function HEAD(request: Request) {
  const session = parseAuthCookie(request.headers.get("cookie"));
  if (!session || session.role !== "admin") {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
