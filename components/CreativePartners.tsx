"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import CmsRichText from "@/components/CmsRichText";
import { defaultCreativePartners, type CreativePartnerItem } from "@/lib/landing-defaults";
import CmsMedia from "@/components/CmsMedia";
import "./creative-partners.css";

export default function CreativePartners() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [partners, setPartners] = useState<CreativePartnerItem[]>(defaultCreativePartners);
  const [activeId, setActiveId] = useState(defaultCreativePartners[0]?.id ?? "");
  const partner = partners.find((item) => item.id === activeId) ?? partners[0];

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.creativePartners) && data.creativePartners.length > 0) {
          setPartners(data.creativePartners);
          setActiveId(data.creativePartners[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  if (!partner) return null;

  return (
    <section id="creative-partners" className="cp-section backstage-section section-block">
      <div className="cp-section__ambient" aria-hidden />

      <div className="container relative z-10 mx-auto">
        <motion.div
          className="cp-header text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">{landing.creativePartnersLabel}</span>
          <h2 className="section-title mb-4">{landing.creativePartnersTitle}</h2>
          <CmsRichText content={landing.creativePartnersIntro} className="mx-auto max-w-2xl" />
        </motion.div>

        <div className="cp-avatars" role="tablist" aria-label="همکاران خلاق">
          {partners.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(item.id)}
                className={`cp-avatar${isActive ? " cp-avatar--active" : ""}`}
                title={item.name}
              >
                {item.avatarVideoSrc ? (
                  <video
                    src={item.avatarVideoSrc}
                    className="cp-avatar__img"
                    muted
                    loop
                    playsInline
                    autoPlay
                    aria-hidden
                  />
                ) : (
                  <img
                    src={item.avatarSrc}
                    alt={item.name}
                    className="cp-avatar__img"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="cp-stage"
          >
            <div className="cp-copy">
              <h3 className="cp-copy__name">{partner.name}</h3>
              <p className="cp-copy__role">{partner.role}</p>
              <p className="cp-copy__showcase">
                <span className="cp-copy__showcase-label">نمونه کار:</span> {partner.showcase}
              </p>
              <p className="cp-copy__bio">{partner.bio}</p>
              <blockquote className="cp-copy__quote">«{partner.quote}»</blockquote>
            </div>

            <div className="cp-video-frame">
              <CmsMedia
                image={partner.avatarSrc}
                videoSrc={partner.videoSrc}
                mediaKind={partner.mediaKind ?? "video"}
                aspectRatio={partner.aspectRatio ?? "landscape"}
                alt={partner.name}
                fill
                fitParent
                objectFit="cover"
                sizes="(max-width: 900px) 100vw, 50vw"
                videoClassName="cp-video"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

