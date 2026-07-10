import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import PortfolioGallery from "@/components/PortfolioGallery";
import { PORTFOLIO_PAGE } from "@/lib/pages-content";

export const metadata: Metadata = {
  title: "نمونه کارها | لیوبیز",
  description: PORTFOLIO_PAGE.intro,
};

export default function PortfolioPage() {
  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={PORTFOLIO_PAGE.label} title={PORTFOLIO_PAGE.title} intro={PORTFOLIO_PAGE.intro} />
        <PortfolioGallery />
      </div>
    </SiteShell>
  );
}
