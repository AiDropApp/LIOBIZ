import { NextResponse } from "next/server";
import { parseAuthCookie } from "@/lib/auth-session";
import { readSiteContent, writeSiteContent, type SiteContent } from "@/lib/content-store";

export const runtime = "nodejs";

function requireAdmin(request: Request) {
  const session = parseAuthCookie(request.headers.get("cookie"));
  if (!session || session.role !== "admin") return null;
  return session;
}

/** Update CMS sections: landing | pages | site | theme | full */
export async function PUT(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "داده نامعتبر" }, { status: 400 });
  }

  const current = await readSiteContent();
  const next: SiteContent = {
    ...current,
    landing: body.landing ? { ...current.landing, ...body.landing } : current.landing,
    pages: body.pages
      ? {
          ...current.pages,
          ...body.pages,
          about: { ...current.pages.about, ...(body.pages.about || {}) },
          contact: { ...current.pages.contact, ...(body.pages.contact || {}) },
          process: { ...current.pages.process, ...(body.pages.process || {}) },
          portfolio: { ...current.pages.portfolio, ...(body.pages.portfolio || {}) },
          services: Array.isArray(body.pages.services) ? body.pages.services : current.pages.services,
          processSteps: Array.isArray(body.pages.processSteps)
            ? body.pages.processSteps
            : current.pages.processSteps,
        }
      : current.pages,
    site: body.site
      ? {
          ...current.site,
          ...body.site,
          socials: Array.isArray(body.site.socials) ? body.site.socials : current.site.socials,
        }
      : current.site,
    theme: body.theme ? { ...current.theme, ...body.theme } : current.theme,
    portfolio: Array.isArray(body.portfolio) ? body.portfolio : current.portfolio,
    backstage: Array.isArray(body.backstage) ? body.backstage : current.backstage,
  };

  await writeSiteContent(next);
  return NextResponse.json({ ok: true, content: next });
}
