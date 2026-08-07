import Hero from "@/components/hero/Hero";
import AboutLiobiz from "@/components/AboutLiobiz";
import Services from "@/components/Services";
import SmoothScroll from "@/components/SmoothScroll";
import SiteShell from "@/components/SiteShell";
import { HomeDataProvider } from "@/components/HomeDataProvider";
import {
  Backstage,
  BlogSection,
  CreativePartners,
  FAQ,
  Partners,
  Plans,
  Portfolio,
  Process,
  Testimonials,
} from "@/components/HomeBelowFold";
import { defaultLanding } from "@/lib/cms-defaults";
import { readPublicSiteContent } from "@/lib/content-store";
import { buildHomePageClientPayload } from "@/lib/homepage-payload";

export default async function HomePage() {
  const content = await readPublicSiteContent();
  const landing = { ...defaultLanding, ...content.landing };
  const homeData = buildHomePageClientPayload(content, landing);

  return (
    <SiteShell mainClassName="">
      <HomeDataProvider value={homeData}>
        <SmoothScroll>
          <Hero />
          <AboutLiobiz />
          <Services />
          <Portfolio />
          <Process />
          <Backstage />
          <Plans />
          <CreativePartners />
          <FAQ />
          <Testimonials />
          <Partners />
          <BlogSection />
        </SmoothScroll>
      </HomeDataProvider>
    </SiteShell>
  );
}
