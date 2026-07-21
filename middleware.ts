import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth-session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseAuthCookie(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (session?.role === "admin") return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    if (session?.role === "client" || session?.role === "admin") return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/dashboard", "/dashboard/:path*"],
};
