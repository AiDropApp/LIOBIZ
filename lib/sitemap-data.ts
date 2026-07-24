import type { MetadataRoute } from "next";
import { SITE, SERVICES } from "@/lib/constants";
import { readSiteContent } from "@/lib/content-store";

export type SitemapLink = {
  label: string;
  href: string;
  description?: string;
  lastModified?: Date;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
};

export type SitemapSection = {
  id: string;
  title: string;
  description?: string;
  links: SitemapLink[];
};

const HOME_SECTIONS: SitemapLink[] = [
  { label: "خدمات", href: "/#services", description: "خدمات آژانس لیوبیز" },
  { label: "نمونه‌کارها", href: "/#portfolio", description: "نمونه‌کارهای منتخب" },
  { label: "فرآیند همکاری", href: "/#process", description: "مراحل همکاری با لیوبیز" },
  { label: "پشت صحنه", href: "/#backstage", description: "گالری پشت صحنه" },
  { label: "پلن‌ها", href: "/#plans", description: "پلن‌های همکاری" },
  { label: "شرکای خلاق", href: "/#creative-partners", description: "Creative Partners" },
  { label: "سوالات متداول", href: "/#faq", description: "پاسخ سوالات رایج" },
  { label: "نظرات مشتریان", href: "/#testimonials", description: "تجربه مشتریان" },
  { label: "همکاران", href: "/#partners", description: "برندهای همکار" },
  { label: "تماس با ما", href: "/#contact", description: "اطلاعات تماس" },
];

export async function buildSitemapSections(): Promise<SitemapSection[]> {
  const content = await readSiteContent();
  const now = new Date();

  const mainPages: SitemapLink[] = [
    { label: "صفحه اصلی", href: "/", lastModified: now, priority: 1, changeFrequency: "weekly" },
    {
      label: content.pages.about.title,
      href: "/about",
      description: content.pages.about.intro,
      lastModified: now,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      label: content.pages.contact.title,
      href: "/contact",
      description: content.pages.contact.intro,
      lastModified: now,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      label: content.pages.process.title,
      href: "/process",
      description: content.pages.process.intro,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      label: content.pages.portfolio.title,
      href: "/portfolio",
      description: content.pages.portfolio.intro,
      lastModified: now,
      priority: 0.9,
      changeFrequency: "weekly",
    },
    {
      label: "بلاگ",
      href: "/blog",
      description: "مقالات و اخبار لیوبیز",
      lastModified: now,
      priority: 0.85,
      changeFrequency: "weekly",
    },
    {
      label: "نقشه سایت",
      href: "/site-map",
      description: "فهرست کامل صفحات و بخش‌های سایت",
      lastModified: now,
      priority: 0.5,
      changeFrequency: "monthly",
    },
  ];

  const serviceLinks: SitemapLink[] = SERVICES.filter((service) => service.href.startsWith("/services/")).map(
    (service) => ({
      label: service.title,
      href: service.href,
      description: service.description,
      lastModified: now,
      priority: 0.75,
      changeFrequency: "monthly" as const,
    }),
  );

  const blogLinks: SitemapLink[] = content.blogPosts
    .filter((post) => post.published)
    .map((post) => ({
      label: post.title,
      href: `/blog/${post.slug}`,
      description: post.excerpt,
      lastModified: new Date(post.publishedAt),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    }));

  return [
    {
      id: "main",
      title: "صفحات اصلی",
      description: "صفحات عمومی و قابل ایندکس سایت",
      links: mainPages,
    },
    {
      id: "home-sections",
      title: "بخش‌های صفحه اصلی",
      description: "لینک مستقیم به بخش‌های صفحه خانه",
      links: HOME_SECTIONS,
    },
    {
      id: "services",
      title: "خدمات",
      description: "صفحات تخصصی خدمات آژانس",
      links: serviceLinks,
    },
    {
      id: "blog",
      title: "مقالات بلاگ",
      description: "مطالب منتشرشده",
      links: blogLinks.length > 0 ? blogLinks : [{ label: "هنوز مقاله‌ای منتشر نشده", href: "/blog" }],
    },
  ];
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const sections = await buildSitemapSections();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const section of sections) {
    for (const link of section.links) {
      if (link.href.startsWith("/#")) continue;
      const url = `${base}${link.href}`;
      if (seen.has(url)) continue;
      seen.add(url);
      entries.push({
        url,
        lastModified: link.lastModified ?? new Date(),
        changeFrequency: link.changeFrequency ?? "monthly",
        priority: link.priority ?? 0.6,
      });
    }
  }

  return entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function getSitemapUrls() {
  const base = SITE.url.replace(/\/$/, "");
  return {
    xml: `${base}/sitemap.xml`,
    html: `${base}/site-map`,
    robots: `${base}/robots.txt`,
  };
}
