import type { MetadataRoute } from "next";
import { SITE, SERVICES } from "@/lib/constants";
import { readSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const content = await readSiteContent();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/process`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
  ];

  const servicePages: MetadataRoute.Sitemap = SERVICES.filter((s) => s.href.startsWith("/services/")).map(
    (service) => ({
      url: `${base}${service.href}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }),
  );

  const blogPages: MetadataRoute.Sitemap = content.blogPosts
    .filter((post) => post.published)
    .map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...servicePages, ...blogPages];
}
