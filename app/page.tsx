import Header from "@/components/Header";
import Hero from "@/components/hero/Hero";
import AboutLiobiz from "@/components/AboutLiobiz";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import Backstage from "@/components/Backstage";
import CreativePartners from "@/components/CreativePartners";
import Partners from "@/components/Partners";
import Testimonials from "@/components/Testimonials";
import Plans from "@/components/Plans";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import SmoothScroll from "@/components/SmoothScroll";
import { defaultLanding } from "@/lib/cms-defaults";
import { readPublicSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await readPublicSiteContent();
  const landing = { ...defaultLanding, ...content.landing };

  return (
    <SmoothScroll>
      <LoadingScreen />
      <Header initialLogoUrl={content.site.logoUrl} />
      <main className="w-full overflow-x-clip">
        <Hero initialLanding={landing} />
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
      </main>
      <Footer />
    </SmoothScroll>
  );
}
