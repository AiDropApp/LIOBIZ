import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import PortfolioGallery from "@/components/PortfolioGallery";
import { readPublicSiteContent } from "@/lib/content-store";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readPublicSiteContent();
  return buildPageMetadata({
    title: `${content.pages.portfolio.title} | لیوبیز`,
    description: content.pages.portfolio.intro,
    pathname: "/portfolio",
  });
}

export default async function PortfolioPage() {
  const content = await readPublicSiteContent();
  const portfolio = content.pages.portfolio;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <EditablePageHero
          labelPath="pages.portfolio.label"
          titlePath="pages.portfolio.title"
          introPath="pages.portfolio.intro"
          label={portfolio.label}
          title={portfolio.title}
          intro={portfolio.intro}
        />
        <PortfolioGallery />
      </div>
    </SiteShell>
  );
}
