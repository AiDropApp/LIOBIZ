import Header from "@/components/Header";
import Hero from "@/components/hero/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import About from "@/components/About";
import Backstage from "@/components/Backstage";
import Stats from "@/components/Stats";
import Partners from "@/components/Partners";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import SmoothScroll from "@/components/SmoothScroll";

export default function HomePage() {
  return (
    <SmoothScroll>
      <LoadingScreen />
      <Header />
      <main>
        <Hero />
        <Services />
        <Stats />
        <Portfolio />
        <Process />
        <About />
        <Backstage />
        <Testimonials />
        <Partners />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
