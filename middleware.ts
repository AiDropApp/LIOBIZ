import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-session";
import { parseAuthCookieEdge } from "@/lib/auth-session-edge";
import { SITE } from "@/lib/constants";
import { SECURITY_HEADERS, buildContentSecurityPolicy } from "@/lib/security-headers";

const CANONICAL_HOSTNAME = new URL(SITE.url).hostname;

function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function withSecurityHeaders(response: NextResponse, nonce: string) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce, process.env.NODE_ENV !== "production"),
  );
  response.headers.delete("X-Powered-By");
  return response;
}

/** Canonicalize `www.liobiz.com` -> `liobiz.com` to avoid duplicate-content / split SEO signals. */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const rawHost = request.headers.get("host") || "";
  const hostname = rawHost.split(":")[0].toLowerCase();
  if (hostname !== `www.${CANONICAL_HOSTNAME}`) return null;
  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOSTNAME;
  url.protocol = "https:";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return withSecurityHeaders(hostRedirect, newNonce());

  const { pathname } = request.nextUrl;
  const session = await parseAuthCookieEdge(request.cookies.get(AUTH_COOKIE)?.value);
  const nonce = newNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (pathname.startsWith("/admin")) {
    if (session?.role === "admin") return withSecurityHeaders(next(), nonce);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/admin");
    return withSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  if (pathname.startsWith("/dashboard")) {
    if (session?.role === "client" || session?.role === "admin") {
      return withSecurityHeaders(next(), nonce);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/dashboard");
    return withSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  return withSecurityHeaders(next(), nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.json|sw.js|robots.txt|sitemap.xml|media/).*)",
  ],
};
