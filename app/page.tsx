import Header from "@/components/Header";
import Hero from "@/components/hero/Hero";
import AboutLiobiz from "@/components/AboutLiobiz";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import Backstage from "@/components/Backstage";
import Partners from "@/components/Partners";
import Testimonials from "@/components/Testimonials";
import Plans from "@/components/Plans";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import SmoothScroll from "@/components/SmoothScroll";

export default function HomePage() {
  return (
    <SmoothScroll>
      <LoadingScreen />
      <Header />
      <main className="w-full overflow-x-clip">
        <Hero />
        <AboutLiobiz />
        <Services />
        <Portfolio />
        <Process />
        <Plans />
        <Backstage />
        <FAQ />
        <Testimonials />
        <Partners />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
