import { promises as fs } from "fs";
import path from "path";
import { getDataDir, getProjectRoot, getUploadsDir } from "@/lib/paths";
import { BACKSTAGE_GALLERY, NAV_LINKS, PORTFOLIO_ITEMS, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { ABOUT_PAGE, BLOG_PAGE, CONTACT_PAGE, PROCESS_PAGE, PORTFOLIO_PAGE, SERVICE_PAGES, SERVICE_PAGE_UI_DEFAULTS, type ServicePageContent } from "@/lib/pages-content";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import {
  defaultCreativePartners,
  defaultFaq,
  defaultFooterQuickLinks,
  defaultFooterServiceLinks,
  defaultPartners,
  defaultPlans,
  defaultProcessSteps,
  defaultServices,
  defaultTeamStats,
  defaultTestimonials,
  type CreativePartnerItem,
  type FaqItem,
  type LinkItem,
  type PartnerItem,
  type PlanItem,
  type ProcessStepItem,
  type ServiceItem,
  type TeamStatItem,
  type TestimonialItem,
} from "@/lib/landing-defaults";
import { defaultBlogPosts, defaultBlogCategories, type BlogPost } from "@/lib/blog-defaults";
import { defaultRedirects, type RedirectRule } from "@/lib/redirects";
import { normalizeMediaFields, type CmsMediaFields } from "@/lib/media-types";
import {
  DEFAULT_PORTFOLIO_CATEGORIES,
  migratePortfolioItems,
  normalizeCategories,
  type PortfolioCategory,
  type PortfolioItemBase,
} from "@/lib/portfolio";
import { readPublicSiteContentWithMedia } from "@/lib/media-center/public";
import { stripInlineStylesDeep } from "@/lib/strip-content-styles";

export type { LandingContent, PortfolioCategory, ServicePageContent };
export { defaultLanding, DEFAULT_PORTFOLIO_CATEGORIES, SERVICE_PAGES };

export type PortfolioItem = PortfolioItemBase;

export type BackstageItem = {
  id: number;
  image: string;
  caption: string;
} & CmsMediaFields;

export type PagesContent = {
  common: {
    backToHome: string;
    backToHomeHref: string;
  };
  about: {
    label: string;
    title: string;
    intro: string;
    story: string;
    storyHeading: string;
    valuesHeading: string;
    contactCta: string;
    contactHref: string;
    values: { title: string; description: string }[];
  };
  contact: {
    label: string;
    title: string;
    intro: string;
    hours: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    formTitle: string;
    formIntro: string;
    nameLabel: string;
    messageLabel: string;
    submitLabel: string;
  };
  process: { label: string; title: string; intro: string; contactCta: string; contactHref: string };
  portfolio: { label: string; title: string; intro: string };
  blog: { label: string; title: string; intro: string; backLink: string; backHref: string };
  services: ServiceItem[];
  processSteps: ProcessStepItem[];
};

export type SiteInfo = {
  name: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  brandDisplayName: string;
  navLinks: LinkItem[];
  socials: Array<{ name: string; href: string }>;
  footerText: string;
};

export type ThemeSettings = {
  primaryColor: string;
  headingScale: "sm" | "md" | "lg";
};

export type { BlogPost };

export type SiteContent = {
  portfolioCategories: PortfolioCategory[];
  portfolio: PortfolioItem[];
  backstage: BackstageItem[];
  landing: LandingContent;
  pages: PagesContent;
  site: SiteInfo;
  theme: ThemeSettings;
  plans: PlanItem[];
  faq: FaqItem[];
  testimonials: TestimonialItem[];
  partners: PartnerItem[];
  creativePartners: CreativePartnerItem[];
  teamStats: TeamStatItem[];
  footerQuickLinks: LinkItem[];
  footerServiceLinks: LinkItem[];
  blogPosts: BlogPost[];
  blogCategories: string[];
  redirects: RedirectRule[];
  servicePages: ServicePageContent[];
};

const DATA_DIR = getDataDir();
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const UPLOADS_DIR = getUploadsDir();

export const defaultPages: PagesContent = {
  common: {
    backToHome: "بازگشت به صفحه اصلی",
    backToHomeHref: "/",
  },
  about: {
    label: ABOUT_PAGE.label,
    title: ABOUT_PAGE.title,
    intro: ABOUT_PAGE.intro,
    story: ABOUT_PAGE.story,
    storyHeading: "داستان ما",
    valuesHeading: "ارزش‌های لیوبیز",
    contactCta: "گفتگو با تیم لیوبیز",
    contactHref: "/contact",
    values: ABOUT_PAGE.values.map((v) => ({ ...v })),
  },
  contact: {
    label: CONTACT_PAGE.label,
    title: CONTACT_PAGE.title,
    intro: CONTACT_PAGE.intro,
    hours: "شنبه تا چهارشنبه، ۹ تا ۱۸",
    phoneLabel: "تلفن",
    emailLabel: "ایمیل",
    addressLabel: "آدرس",
    formTitle: "فرم ارتباط سریع",
    formIntro:
      "جزئیات درخواست‌تان را بنویسید. پیام‌ها در پنل مدیریت لیوبیز ثبت می‌شود و تیم ما مستقیماً پیگیری می‌کند.",
    nameLabel: "نام و نام خانوادگی",
    messageLabel: "پیام شما",
    submitLabel: "ارسال پیام",
  },
  process: {
    label: PROCESS_PAGE.label,
    title: PROCESS_PAGE.title,
    intro: PROCESS_PAGE.intro,
    contactCta: "شروع همکاری",
    contactHref: "/contact",
  },
  portfolio: {
    label: PORTFOLIO_PAGE.label,
    title: PORTFOLIO_PAGE.title,
    intro: PORTFOLIO_PAGE.intro,
  },
  blog: { ...BLOG_PAGE, backLink: "← بازگشت به بلاگ", backHref: "/blog" },
  services: defaultServices,
  processSteps: defaultProcessSteps,
};

export const defaultSite: SiteInfo = {
  name: SITE.name,
  title: SITE.title,
  description: SITE.description,
  phone: SITE.phone,
  email: SITE.email,
  address: SITE.address,
  logoUrl: "/images/logo.png",
  brandDisplayName: "LIOBIZ",
  navLinks: NAV_LINKS.map((l) => ({ ...l })),
  socials: SOCIAL_LINKS.map((s) => ({ name: s.name, href: s.href })),
  footerText: SITE.description,
};

export const defaultTheme: ThemeSettings = {
  primaryColor: "#ff6a00",
  headingScale: "md",
};

const defaultPortfolioMigrated = migratePortfolioItems(PORTFOLIO_ITEMS, DEFAULT_PORTFOLIO_CATEGORIES);

function mergeServicePages(parsed?: ServicePageContent[]): ServicePageContent[] {
  return SERVICE_PAGES.map((def) => {
    const override = parsed?.find((p) => p.slug === def.slug);
    if (!override) return { ...SERVICE_PAGE_UI_DEFAULTS, ...def };
    return {
      ...SERVICE_PAGE_UI_DEFAULTS,
      ...def,
      ...override,
      outcomes: override.outcomes?.length ? override.outcomes : def.outcomes,
      deliverables: override.deliverables?.length ? override.deliverables : def.deliverables,
      process: override.process?.length ? override.process : def.process,
    };
  });
}

const defaults: SiteContent = {
  portfolioCategories: defaultPortfolioMigrated.categories,
  portfolio: defaultPortfolioMigrated.portfolio,
  backstage: BACKSTAGE_GALLERY,
  landing: defaultLanding,
  pages: defaultPages,
  site: defaultSite,
  theme: defaultTheme,
  plans: defaultPlans,
  faq: defaultFaq,
  testimonials: defaultTestimonials,
  partners: defaultPartners,
  creativePartners: defaultCreativePartners,
  teamStats: defaultTeamStats,
  footerQuickLinks: defaultFooterQuickLinks,
  footerServiceLinks: defaultFooterServiceLinks,
  blogPosts: defaultBlogPosts,
  blogCategories: defaultBlogCategories,
  redirects: defaultRedirects,
  servicePages: SERVICE_PAGES,
};

function mergeLanding(parsed?: Partial<LandingContent>): LandingContent {
  return {
    ...defaults.landing,
    ...(parsed || {}),
    heroStats: Array.isArray(parsed?.heroStats) ? parsed!.heroStats : defaults.landing.heroStats,
  };
}

/** Merge backup/partial CMS JSON with code defaults (keeps new sections after restore). */
export function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  const baseCategories = normalizeCategories(
    Array.isArray(parsed.portfolioCategories) ? parsed.portfolioCategories : defaults.portfolioCategories,
  );
  const migrated = migratePortfolioItems(
    Array.isArray(parsed.portfolio) ? parsed.portfolio : defaults.portfolio,
    baseCategories,
  );

  return {
    portfolioCategories: migrated.categories,
    portfolio: migrated.portfolio,
    backstage: Array.isArray(parsed.backstage)
      ? parsed.backstage.map((item) => normalizeMediaFields(item))
      : defaults.backstage.map((item) => normalizeMediaFields(item)),
    landing: mergeLanding(parsed.landing),
    pages: {
      ...defaults.pages,
      ...(parsed.pages || {}),
      common: { ...defaults.pages.common, ...(parsed.pages?.common || {}) },
      about: {
        ...defaults.pages.about,
        ...(parsed.pages?.about || {}),
        values: Array.isArray(parsed.pages?.about?.values)
          ? parsed.pages!.about!.values
          : defaults.pages.about.values,
      },
      contact: { ...defaults.pages.contact, ...(parsed.pages?.contact || {}) },
      process: { ...defaults.pages.process, ...(parsed.pages?.process || {}) },
      portfolio: { ...defaults.pages.portfolio, ...(parsed.pages?.portfolio || {}) },
      blog: { ...defaults.pages.blog, ...(parsed.pages?.blog || {}) },
      services: Array.isArray(parsed.pages?.services) ? parsed.pages!.services : defaults.pages.services,
      processSteps: Array.isArray(parsed.pages?.processSteps)
        ? parsed.pages!.processSteps
        : defaults.pages.processSteps,
    },
    site: {
      ...defaults.site,
      ...(parsed.site || {}),
      navLinks: Array.isArray(parsed.site?.navLinks) ? parsed.site!.navLinks : defaults.site.navLinks,
      socials: Array.isArray(parsed.site?.socials) ? parsed.site!.socials : defaults.site.socials,
    },
    theme: { ...defaults.theme, ...(parsed.theme || {}) },
    plans: Array.isArray(parsed.plans) ? parsed.plans : defaults.plans,
    faq: Array.isArray(parsed.faq) ? parsed.faq : defaults.faq,
    testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaults.testimonials,
    partners: Array.isArray(parsed.partners) ? parsed.partners : defaults.partners,
    creativePartners: Array.isArray(parsed.creativePartners)
      ? parsed.creativePartners.map((item) => normalizeMediaFields(item))
      : defaults.creativePartners.map((item) => normalizeMediaFields(item)),
    teamStats: Array.isArray(parsed.teamStats) ? parsed.teamStats : defaults.teamStats,
    footerQuickLinks: Array.isArray(parsed.footerQuickLinks)
      ? parsed.footerQuickLinks
      : defaults.footerQuickLinks,
    footerServiceLinks: Array.isArray(parsed.footerServiceLinks)
      ? parsed.footerServiceLinks
      : defaults.footerServiceLinks,
    blogPosts: Array.isArray(parsed.blogPosts) ? parsed.blogPosts : defaults.blogPosts,
    blogCategories: Array.isArray(parsed.blogCategories)
      ? parsed.blogCategories
      : defaults.blogCategories,
    redirects: Array.isArray(parsed.redirects) ? parsed.redirects : defaults.redirects,
    servicePages: mergeServicePages(
      Array.isArray(parsed.servicePages) ? parsed.servicePages : defaults.servicePages,
    ),
  };
}

async function ensureUploadDirs() {
  for (const folder of ["portfolio", "backstage", "hero", "about", "creative-partners", "orders", "uploads"]) {
    await fs.mkdir(path.join(UPLOADS_DIR, folder), { recursive: true });
  }
}

async function parseSiteContentFile(): Promise<Partial<SiteContent>> {
  let raw = "";
  try {
    raw = await fs.readFile(CONTENT_FILE, "utf8");
  } catch {
    return {};
  }
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as Partial<SiteContent>;
  } catch (error) {
    console.error("[content-store] Invalid site-content.json:", error);
    const restored = await restoreSiteContentFromSnapshot();
    if (restored) return restored;
    return {};
  }
}

async function restoreSiteContentFromSnapshot(): Promise<Partial<SiteContent> | null> {
  const snapDir = path.join(getDataDir(), "snapshots", "site-content");
  try {
    const files = (await fs.readdir(snapDir))
      .filter((name) => name.endsWith(".json"))
      .sort()
      .reverse();
    for (const name of files.slice(0, 8)) {
      try {
        const snapRaw = (await fs.readFile(path.join(snapDir, name), "utf8")).trim();
        if (!snapRaw) continue;
        const parsed = JSON.parse(snapRaw) as Partial<SiteContent>;
        const merged = mergeContent(parsed);
        await writeSiteContentFile(merged);
        return parsed;
      } catch {
        continue;
      }
    }
  } catch {
    /* no snapshots */
  }
  return null;
}

async function writeSiteContentFile(content: SiteContent) {
  const tmp = `${CONTENT_FILE}.${process.pid}.${Date.now()}.tmp`;
  const body = JSON.stringify(content, null, 2);
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, CONTENT_FILE);
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await ensureUploadDirs();
  const parsed = await parseSiteContentFile();
  const merged = mergeContent(parsed);
  const needsWrite =
    !parsed.landing?.heroStats ||
    !parsed.plans ||
    !parsed.faq ||
    !parsed.creativePartners ||
    !parsed.landing?.aboutImage1 ||
    !parsed.pages?.common ||
    !Array.isArray(parsed.portfolioCategories) ||
    !Array.isArray(parsed.blogPosts) ||
    !trimmedJsonExists(parsed);
  if (needsWrite) {
    await writeSiteContentFile(merged);
  }
}

function trimmedJsonExists(parsed: Partial<SiteContent>): boolean {
  return Boolean(parsed && Object.keys(parsed).length > 0);
}

async function mediaUploadExists(url?: string): Promise<boolean> {
  if (!url?.trim()) return false;
  if (url.startsWith("/api/media/filesir/")) return true;
  if (!url.startsWith("/api/media/")) return true;
  const relative = url.replace("/api/media/", "");
  const [folder, ...rest] = relative.split("/");
  if (!folder || rest.length === 0) return false;
  const filePath = path.join(getUploadsDir(), folder, rest.join("/"));
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hydrateBackstage(items: BackstageItem[]): Promise<BackstageItem[]> {
  const hydrated: BackstageItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let image = item.image;
    if (!(await mediaUploadExists(image))) {
      const fallback = BACKSTAGE_GALLERY[i % BACKSTAGE_GALLERY.length];
      image = fallback?.image || "/images/backstage-meeting.png";
    }
    hydrated.push(normalizeMediaFields({ ...item, image }));
  }
  return hydrated;
}

export async function readSiteContent(): Promise<SiteContent> {
  await ensureStore();
  const parsed = await parseSiteContentFile();
  const merged = mergeContent(Object.keys(parsed).length ? parsed : {});
  merged.backstage = await hydrateBackstage(merged.backstage);
  return merged;
}

/** Public landing/pages: overlay published media-center cards on CMS JSON. */
export async function readPublicSiteContent(): Promise<SiteContent> {
  const merged = await readSiteContent();
  const withMedia = await readPublicSiteContentWithMedia(merged);
  return stripInlineStylesDeep(withMedia);
}

export async function writeSiteContent(content: SiteContent) {
  await ensureStore();
  const { snapshotJsonFile } = await import("@/lib/json-snapshot");
  await snapshotJsonFile(CONTENT_FILE, "site-content");
  await writeSiteContentFile(content);
}

export async function updateSiteContent(patch: Partial<SiteContent>) {
  const current = await readSiteContent();
  const next = mergeContent({ ...current, ...patch });
  await writeSiteContent(next);
  return next;
}

export function getServicePageFromContent(content: SiteContent, slug: string) {
  return content.servicePages.find((item) => item.slug === slug);
}
