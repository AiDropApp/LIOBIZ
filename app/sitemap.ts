import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
