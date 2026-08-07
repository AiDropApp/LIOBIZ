import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-media-guard";
import { readSiteContent, writeSiteContent, type BackstageItem, type PortfolioItem, type SiteContent } from "@/lib/content-store";
import { readMediaCenterStore } from "@/lib/media-center/store";
import { isVideoUrl, normalizeMediaFields } from "@/lib/media-types";
import type { CreativePartnerItem } from "@/lib/landing-defaults";

export const runtime = "nodejs";

/** Update CMS sections from admin landing editor */
export async function PUT(request: Request) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "داده نامعتبر" }, { status: 400 });
  }

  const current = await readSiteContent();
  const mediaStore = await readMediaCenterStore();
  const hasMediaPortfolio = mediaStore.cards.some((c) => c.section === "portfolio" && c.published);
  const hasMediaBackstage = mediaStore.cards.some((c) => c.section === "backstage");
  const hasMediaPartners = mediaStore.cards.some((c) => c.section === "creative-partners" && c.published);

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
    portfolioCategories: hasMediaPortfolio
      ? current.portfolioCategories
      : Array.isArray(body.portfolioCategories)
        ? body.portfolioCategories
        : current.portfolioCategories,
    portfolio: hasMediaPortfolio
      ? current.portfolio
      : Array.isArray(body.portfolio)
        ? body.portfolio
        : current.portfolio,
    backstage: hasMediaBackstage
      ? current.backstage
      : Array.isArray(body.backstage)
        ? body.backstage
        : current.backstage,
    plans: Array.isArray(body.plans) ? body.plans : current.plans,
    faq: Array.isArray(body.faq) ? body.faq : current.faq,
    testimonials: Array.isArray(body.testimonials) ? body.testimonials : current.testimonials,
    partners: Array.isArray(body.partners) ? body.partners : current.partners,
    creativePartners: hasMediaPartners
      ? current.creativePartners
      : Array.isArray(body.creativePartners)
        ? body.creativePartners
        : current.creativePartners,
    teamStats: Array.isArray(body.teamStats) ? body.teamStats : current.teamStats,
    footerQuickLinks: Array.isArray(body.footerQuickLinks)
      ? body.footerQuickLinks
      : current.footerQuickLinks,
    footerServiceLinks: Array.isArray(body.footerServiceLinks)
      ? body.footerServiceLinks
      : current.footerServiceLinks,
    blogPosts: Array.isArray(body.blogPosts) ? body.blogPosts : current.blogPosts,
    blogCategories: Array.isArray(body.blogCategories) ? body.blogCategories : current.blogCategories,
    redirects: Array.isArray(body.redirects) ? body.redirects : current.redirects,
    servicePages: Array.isArray(body.servicePages) ? body.servicePages : current.servicePages,
  };

  if (body.landing?.heroStats) {
    next.landing.heroStats = body.landing.heroStats;
  }

  if (body.landing?.heroMediaUrl !== undefined) {
    const heroMediaUrl = String(body.landing.heroMediaUrl || "").trim();
    next.landing.heroMediaUrl = heroMediaUrl;
    next.landing.heroMediaType = isVideoUrl(heroMediaUrl) ? "video" : "image";
  }

  if (Array.isArray(body.portfolio) && !hasMediaPortfolio) {
    next.portfolio = (body.portfolio as PortfolioItem[]).map((item) => normalizeMediaFields(item));
  }

  if (Array.isArray(body.backstage) && !hasMediaBackstage) {
    next.backstage = (body.backstage as BackstageItem[]).map((item) => normalizeMediaFields(item));
  }

  if (Array.isArray(body.creativePartners) && !hasMediaPartners) {
    next.creativePartners = (body.creativePartners as CreativePartnerItem[]).map((item) =>
      normalizeMediaFields({
        ...item,
        avatarSrc: item.avatarSrc ?? (item as { image?: string }).image,
      }),
    );
  }

  await writeSiteContent(next);
  return NextResponse.json({ ok: true, content: next });
}
