"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import HeroContent from "./content/HeroContent";
import HeroStats from "./content/HeroStats";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import type { LandingContent } from "@/lib/cms-defaults";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import EditableImage from "@/components/cms-edit/EditableImage";
import {
  isVideoUrl,
  needsIframeVideoEmbed,
  toPlayableVideoUrl,
} from "@/lib/media-types";
import { blockMediaContextMenu, MEDIA_PROTECT_CLASS, protectedVideoProps } from "@/lib/media-protect";

export default function Hero({ initialLanding }: { initialLanding?: LandingContent }) {
  const cms = useCmsEdit();
  const reducedMotion = usePrefersReducedMotion();
  const landing = useHomeLanding(initialLanding);
  const activeLanding = landing;

  const rawMedia = activeLanding.heroMediaUrl.trim();
  const media = rawMedia;
  const isVideo = Boolean(media) && (activeLanding.heroMediaType === "video" || isVideoUrl(media));
  const useIframe = isVideo && needsIframeVideoEmbed(media);
  const playable = isVideo ? toPlayableVideoUrl(media) : media;

  return (
    <section id="home" className="hero-section">
      <div className="hero-panel">
        <div
          className={`hero-video-stage ${MEDIA_PROTECT_CLASS}`}
          aria-hidden="true"
          onContextMenu={blockMediaContextMenu}
        >
        <EditableImage
          path="landing.heroMediaUrl"
          src={media}
          alt=""
          uploadKind="hero"
          className="hero-video object-cover"
          fill
        >
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
                preload="none"
                key={playable}
                {...protectedVideoProps}
              />
            )
          ) : media ? (
            <Image src={media} alt="" fill className="hero-video object-cover" priority sizes="100vw" />
          ) : null}
        </EditableImage>
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
                landing={activeLanding}
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
