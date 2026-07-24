import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, Globe, Map, Rss } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import { SITE } from "@/lib/constants";
import { buildSitemapSections, getSitemapUrls } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `نقشه سایت | ${SITE.name}`,
    description: "فهرست کامل صفحات، خدمات و مقالات سایت لیوبیز برای دسترسی سریع و ایندکس موتورهای جستجو.",
    alternates: {
      canonical: `${SITE.url.replace(/\/$/, "")}/site-map`,
    },
  };
}

function formatDate(date?: Date) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export default async function SiteMapPage() {
  const sections = await buildSitemapSections();
  const urls = getSitemapUrls();
  const totalLinks = sections.reduce((sum, section) => sum + section.links.length, 0);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero
          label="Sitemap"
          title="نقشه سایت"
          intro="فهرست ساختاریافته تمام صفحات، خدمات و مقالات لیوبیز. برای موتورهای جستجو از نسخه XML استفاده کنید."
        />

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <a href={urls.xml} className="sitemap-card lux-card group" target="_blank" rel="noopener noreferrer">
            <div className="sitemap-card-icon">
              <Rss size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sitemap XML</h2>
              <p className="mt-1 text-sm text-muted">برای Google، Bing و سایر موتورهای جستجو</p>
              <p className="mt-3 text-sm font-medium text-primary group-hover:underline">{urls.xml}</p>
            </div>
            <ExternalLink size={16} className="text-muted" />
          </a>

          <div className="sitemap-card lux-card">
            <div className="sitemap-card-icon">
              <Map size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">نقشه HTML</h2>
              <p className="mt-1 text-sm text-muted">همین صفحه — برای کاربران و مرور سریع</p>
              <p className="mt-3 text-sm font-medium text-primary">{urls.html}</p>
            </div>
          </div>

          <a href={urls.robots} className="sitemap-card lux-card group" target="_blank" rel="noopener noreferrer">
            <div className="sitemap-card-icon">
              <Globe size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Robots.txt</h2>
              <p className="mt-1 text-sm text-muted">دستورالعمل خزیدن برای ربات‌ها</p>
              <p className="mt-3 text-sm font-medium text-primary group-hover:underline">{urls.robots}</p>
            </div>
            <ExternalLink size={16} className="text-muted" />
          </a>
        </section>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{totalLinks} لینک</span>
          <span className="rounded-full bg-background-soft px-3 py-1">{sections.length} دسته</span>
          <span className="rounded-full bg-background-soft px-3 py-1">آخرین به‌روزرسانی: {formatDate(new Date())}</span>
        </div>

        <div className="grid gap-8">
          {sections.map((section) => (
            <section key={section.id} className="lux-card sitemap-section">
              <div className="mb-5 flex items-start gap-3">
                <div className="sitemap-card-icon shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  {section.description ? <p className="mt-1 text-sm text-muted">{section.description}</p> : null}
                </div>
              </div>

              <ul className="sitemap-link-list">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.href}`} className="sitemap-link-item">
                    <Link href={link.href} className="sitemap-link-title">
                      {link.label}
                    </Link>
                    {link.description ? <p className="sitemap-link-desc">{link.description}</p> : null}
                    <div className="sitemap-link-meta">
                      <code>{link.href}</code>
                      {link.lastModified ? <span>به‌روزرسانی: {formatDate(link.lastModified)}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
