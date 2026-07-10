import { promises as fs } from "fs";
import path from "path";
import { BACKSTAGE_GALLERY, PORTFOLIO_ITEMS, SITE, SOCIAL_LINKS, SERVICES, PROCESS_STEPS } from "@/lib/constants";
import { ABOUT_PAGE, CONTACT_PAGE, PROCESS_PAGE, PORTFOLIO_PAGE } from "@/lib/pages-content";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";

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
};

export type BackstageItem = {
  id: number;
  image: string;
  caption: string;
};

export type PagesContent = {
  about: { label: string; title: string; intro: string };
  contact: { label: string; title: string; intro: string; hours: string };
  process: { label: string; title: string; intro: string };
  portfolio: { label: string; title: string; intro: string };
  services: Array<{ id: string; title: string; description: string; href: string }>;
  processSteps: Array<{ id: string; title: string; description: string }>;
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
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");

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
  services: SERVICES.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    href: s.href,
  })),
  processSteps: PROCESS_STEPS.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
  })),
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
};

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  return {
    portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : defaults.portfolio,
    backstage: Array.isArray(parsed.backstage) ? parsed.backstage : defaults.backstage,
    landing: { ...defaults.landing, ...(parsed.landing || {}) },
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
  };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const merged = mergeContent(parsed);
    if (!parsed.landing || !parsed.pages || !parsed.site || !parsed.theme) {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(merged, null, 2), "utf8");
    }
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaults, null, 2), "utf8");
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  await ensureStore();
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<SiteContent>;
  return mergeContent(parsed);
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
