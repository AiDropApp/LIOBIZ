import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import AboutPageContent from "@/components/pages/AboutPageContent";
import { defaultLanding } from "@/lib/cms-defaults";
import { readSiteContent } from "@/lib/content-store";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readSiteContent();
  return buildPageMetadata({
    title: `${content.pages.about.title} | لیوبیز`,
    description: content.pages.about.intro,
    pathname: "/about",
  });
}

export default async function AboutPage() {
  const content = await readSiteContent();

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <AboutPageContent
          about={content.pages.about}
          heroStats={content.landing.heroStats?.length ? content.landing.heroStats : defaultLanding.heroStats}
        />
      </div>
    </SiteShell>
  );
}
