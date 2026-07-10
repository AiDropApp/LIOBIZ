import { promises as fs } from "fs";
import path from "path";
import { BACKSTAGE_GALLERY, PORTFOLIO_ITEMS } from "@/lib/constants";

export type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  image: string;
};

export type BackstageItem = {
  id: number;
  image: string;
  caption: string;
};

export type SiteContent = {
  portfolio: PortfolioItem[];
  backstage: BackstageItem[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");

const defaults: SiteContent = {
  portfolio: PORTFOLIO_ITEMS,
  backstage: BACKSTAGE_GALLERY,
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaults, null, 2), "utf8");
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  await ensureStore();
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const parsed = JSON.parse(raw) as SiteContent;
  return {
    portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : defaults.portfolio,
    backstage: Array.isArray(parsed.backstage) ? parsed.backstage : defaults.backstage,
  };
}

export async function writeSiteContent(content: SiteContent) {
  await ensureStore();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}
