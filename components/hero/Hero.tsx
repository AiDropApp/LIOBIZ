"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import HeroContent from "./content/HeroContent";
import HeroStats from "./content/HeroStats";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import type { LandingContent } from "@/lib/cms-defaults";
import { defaultLanding } from "@/lib/cms-defaults";
import {
  isVideoUrl,
  needsIframeVideoEmbed,
  toPlayableVideoUrl,
} from "@/lib/media-types";

export default function Hero({ initialLanding }: { initialLanding?: LandingContent }) {
  const reducedMotion = usePrefersReducedMotion();
  const [landing, setLanding] = useState<LandingContent>(initialLanding ?? defaultLanding);

  useEffect(() => {
    if (initialLanding) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, [initialLanding]);

  const rawMedia = landing.heroMediaUrl.trim();
  const media = rawMedia.includes("/videos/header.mp4") ? "" : rawMedia;
  const isVideo = Boolean(media) && (landing.heroMediaType === "video" || isVideoUrl(media));
  const useIframe = isVideo && needsIframeVideoEmbed(media);
  const playable = isVideo ? toPlayableVideoUrl(media) : media;

  return (
    <section id="home" className="hero-section">
      <div className="hero-panel">
        <div className="hero-video-stage" aria-hidden="true">
          {isVideo ? (
            useIframe ? (
              <iframe
                className="hero-video hero-video-embed"
                src={playable}
                title="ویدیو پس‌زمینه"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                key={playable}
              />
            ) : (
              <video
                className="hero-video"
                src={playable}
                autoPlay={!reducedMotion}
                muted
                loop
                playsInline
                preload="metadata"
                key={playable}
              />
            )
          ) : media ? (
            <Image src={media} alt="" fill className="hero-video object-cover" priority sizes="100vw" />
          ) : null}
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
