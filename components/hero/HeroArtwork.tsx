"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function HeroArtwork() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
      className="hero-visual relative mx-auto w-full max-w-[560px] lg:max-w-none"
    >
      <div className="hero-visual-glow" aria-hidden="true" />
      <div className="hero-visual-frame">
        <Image
          src="/images/hero-lion.png"
          alt="شیر لیوبیز — نماد قدرت برند"
          width={900}
          height={900}
          priority
          className="hero-visual-image"
          sizes="(max-width: 1024px) 90vw, 48vw"
        />
        <div className="hero-visual-embers" aria-hidden="true" />
      </div>
    </motion.div>
  );
}
