import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { readSiteContent } from "@/lib/content-store";

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function HEAD() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
