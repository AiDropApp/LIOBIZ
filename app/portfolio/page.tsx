import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import PortfolioGallery from "@/components/PortfolioGallery";
import { readPublicSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readPublicSiteContent();
  return {
    title: `${content.pages.portfolio.title} | لیوبیز`,
    description: content.pages.portfolio.intro,
  };
}

export default async function PortfolioPage() {
  const content = await readPublicSiteContent();
  const portfolio = content.pages.portfolio;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={portfolio.label} title={portfolio.title} intro={portfolio.intro} />
        <PortfolioGallery />
      </div>
    </SiteShell>
  );
}
