"use client";

import { motion } from "framer-motion";
import Background from "./Background/Background";
import HeroContent from "./content/HeroContent";
import HeroArtwork from "./HeroArtwork";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section id="home" className="hero-section relative overflow-hidden pt-32 pb-20 lg:pb-28">
      <Background opacity={1} />

      <div className="container relative z-20 mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.44fr_0.56fr] lg:gap-10 xl:gap-14">
          <HeroContent reducedMotion={reducedMotion} delay={reducedMotion ? 0 : 0.22} />

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: reducedMotion ? 0 : 0.08 }}
            className="order-1 flex justify-center lg:order-2 lg:justify-end"
          >
            <HeroArtwork />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
