import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import ServicePageContent from "@/components/pages/ServicePageContent";
import { getServicePageFromContent, readPublicSiteContent } from "@/lib/content-store";
import { SERVICE_PAGES } from "@/lib/pages-content";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_PAGES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const service = getServicePageFromContent(content, slug);
  if (!service) return { title: "خدمات | لیوبیز" };
  return buildPageMetadata({
    title: `${service.title} | لیوبیز`,
    description: service.intro,
    pathname: `/services/${slug}`,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const service = getServicePageFromContent(content, slug);
  const index = content.servicePages.findIndex((item) => item.slug === slug);

  if (!service || index < 0) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-20 text-center lg:px-8">
          <h1 className="section-title">خدمت پیدا نشد</h1>
          <Link href="/" className="btn-accent mt-8 inline-flex">
            بازگشت به خانه
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <ServicePageContent service={service} index={index} />
      </div>
    </SiteShell>
  );
}
