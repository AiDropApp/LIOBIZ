import { promises as fs } from "fs";
import path from "path";
import { BACKSTAGE_GALLERY, PORTFOLIO_ITEMS, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { ABOUT_PAGE, CONTACT_PAGE, PROCESS_PAGE, PORTFOLIO_PAGE } from "@/lib/pages-content";
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
import { normalizeMediaFields, type CmsMediaFields } from "@/lib/media-types";

export type { LandingContent };
export { defaultLanding };

export type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  image: string;
  description?: string;
  client?: string;
  year?: string;
} & CmsMediaFields;

export type BackstageItem = {
  id: number;
  image: string;
  caption: string;
} & CmsMediaFields;

export type PagesContent = {
  about: { label: string; title: string; intro: string };
  contact: { label: string; title: string; intro: string; hours: string };
  process: { label: string; title: string; intro: string };
  portfolio: { label: string; title: string; intro: string };
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
  socials: Array<{ name: string; href: string }>;
  footerText: string;
};

export type ThemeSettings = {
  primaryColor: string;
  headingScale: "sm" | "md" | "lg";
};

export type SiteContent = {
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
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export const defaultPages: PagesContent = {
  about: {
    label: ABOUT_PAGE.label,
    title: ABOUT_PAGE.title,
    intro: ABOUT_PAGE.intro,
  },
  contact: {
    label: CONTACT_PAGE.label,
    title: CONTACT_PAGE.title,
    intro: CONTACT_PAGE.intro,
    hours: "شنبه تا چهارشنبه، ۹ تا ۱۸",
  },
  process: {
    label: PROCESS_PAGE.label,
    title: PROCESS_PAGE.title,
    intro: PROCESS_PAGE.intro,
  },
  portfolio: {
    label: PORTFOLIO_PAGE.label,
    title: PORTFOLIO_PAGE.title,
    intro: PORTFOLIO_PAGE.intro,
  },
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
  socials: SOCIAL_LINKS.map((s) => ({ name: s.name, href: s.href })),
  footerText: SITE.description,
};

export const defaultTheme: ThemeSettings = {
  primaryColor: "#ff6a00",
  headingScale: "md",
};

const defaults: SiteContent = {
  portfolio: PORTFOLIO_ITEMS,
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
};

function mergeLanding(parsed?: Partial<LandingContent>): LandingContent {
  return {
    ...defaults.landing,
    ...(parsed || {}),
    heroStats: Array.isArray(parsed?.heroStats) ? parsed!.heroStats : defaults.landing.heroStats,
  };
}

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  return {
    portfolio: Array.isArray(parsed.portfolio)
      ? parsed.portfolio.map((item) => normalizeMediaFields(item))
      : defaults.portfolio.map((item) => normalizeMediaFields(item)),
    backstage: Array.isArray(parsed.backstage)
      ? parsed.backstage.map((item) => normalizeMediaFields(item))
      : defaults.backstage.map((item) => normalizeMediaFields(item)),
    landing: mergeLanding(parsed.landing),
    pages: {
      ...defaults.pages,
      ...(parsed.pages || {}),
      about: { ...defaults.pages.about, ...(parsed.pages?.about || {}) },
      contact: { ...defaults.pages.contact, ...(parsed.pages?.contact || {}) },
      process: { ...defaults.pages.process, ...(parsed.pages?.process || {}) },
      portfolio: { ...defaults.pages.portfolio, ...(parsed.pages?.portfolio || {}) },
      services: Array.isArray(parsed.pages?.services) ? parsed.pages!.services : defaults.pages.services,
      processSteps: Array.isArray(parsed.pages?.processSteps)
        ? parsed.pages!.processSteps
        : defaults.pages.processSteps,
    },
    site: {
      ...defaults.site,
      ...(parsed.site || {}),
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
  };
}

async function ensureUploadDirs() {
  for (const folder of ["portfolio", "backstage", "hero", "about", "creative-partners", "orders", "uploads"]) {
    await fs.mkdir(path.join(UPLOADS_DIR, folder), { recursive: true });
  }
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await ensureUploadDirs();
  try {
    await fs.access(CONTENT_FILE);
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const merged = mergeContent(parsed);
    const needsWrite =
      !parsed.landing?.heroStats ||
      !parsed.plans ||
      !parsed.faq ||
      !parsed.creativePartners ||
      !parsed.landing?.aboutImage1;
    if (needsWrite) {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(merged, null, 2), "utf8");
    }
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaults, null, 2), "utf8");
  }
}

async function mediaUploadExists(url?: string): Promise<boolean> {
  if (!url?.startsWith("/api/media/")) return true;
  const relative = url.replace("/api/media/", "");
  const [folder, ...rest] = relative.split("/");
  if (!folder || rest.length === 0) return false;
  const filePath = path.join(process.cwd(), "public", "uploads", folder, rest.join("/"));
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
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<SiteContent>;
  const merged = mergeContent(parsed);
  merged.backstage = await hydrateBackstage(merged.backstage);
  return merged;
}

export async function writeSiteContent(content: SiteContent) {
  await ensureStore();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}

export async function updateSiteContent(patch: Partial<SiteContent>) {
  const current = await readSiteContent();
  const next = mergeContent({ ...current, ...patch });
  await writeSiteContent(next);
  return next;
}
