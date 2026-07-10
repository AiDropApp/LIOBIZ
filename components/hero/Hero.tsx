"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import HeroContent from "./content/HeroContent";
import HeroStats from "./content/HeroStats";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import type { LandingContent } from "@/lib/cms-defaults";
import { defaultLanding } from "@/lib/cms-defaults";

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, []);

  const media = landing.heroMediaUrl || "/videos/header.mp4";
  const isVideo = landing.heroMediaType === "video" || media.endsWith(".mp4") || media.endsWith(".webm");

  return (
    <section id="home" className="hero-section">
      <div className="hero-panel">
        <div className="hero-video-stage" aria-hidden="true">
          {isVideo ? (
            <video
              className="hero-video"
              src={media}
              autoPlay={!reducedMotion}
              muted
              loop
              playsInline
              preload="metadata"
              key={media}
            />
          ) : (
            <Image src={media} alt="" fill className="hero-video object-cover" priority sizes="100vw" />
          )}
          <div className="hero-video-scrim" />
        </div>

        <div className="hero-panel-inner">
          <div className="hero-layout">
            <motion.div
              className="hero-copy"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
            >
              <HeroContent
                reducedMotion={reducedMotion}
                delay={reducedMotion ? 0 : 0.12}
                landing={landing}
              />
            </motion.div>
          </div>
        </div>

        <div className="hero-stats-bridge">
          <HeroStats reducedMotion={reducedMotion} delay={reducedMotion ? 0 : 0.25} />
        </div>
      </div>
    </section>
  );
}
