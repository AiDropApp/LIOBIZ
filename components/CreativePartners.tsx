"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { defaultCreativePartners, type CreativePartnerItem } from "@/lib/landing-defaults";
import CmsMedia from "@/components/CmsMedia";
import { protectedImageProps, protectedVideoProps } from "@/lib/media-protect";
import "./creative-partners.css";

export default function CreativePartners({
  initialLanding,
  initialPartners,
}: {
  initialLanding?: LandingContent;
  initialPartners?: CreativePartnerItem[];
} = {}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const initialPartnersList = home?.creativePartners ?? initialPartners ?? defaultCreativePartners;
  const [partners, setPartners] = useState<CreativePartnerItem[]>(initialPartnersList);
  const [activeId, setActiveId] = useState(initialPartnersList[0]?.id ?? "");
  const partner = partners.find((item) => item.id === activeId) ?? partners[0];
  const partnerIndex = partners.findIndex((item) => item.id === activeId);

  useEffect(() => {
    if (home?.creativePartners || initialPartners) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.creativePartners) && data.creativePartners.length > 0) {
          setPartners(data.creativePartners);
          setActiveId(data.creativePartners[0].id);
        }
      })
      .catch(() => undefined);
  }, [home?.creativePartners, initialPartners]);

  if (!partner || partnerIndex < 0) return null;

  const base = `creativePartners.${partnerIndex}`;

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
          <LandingSectionHeader
            labelPath="landing.creativePartnersLabel"
            titlePath="landing.creativePartnersTitle"
            introPath="landing.creativePartnersIntro"
            label={landing.creativePartnersLabel}
            title={landing.creativePartnersTitle}
            intro={landing.creativePartnersIntro}
            className="cp-header text-center"
            titleClassName="section-title mb-4"
          />
        </motion.div>

        <div className="cp-avatars" role="tablist" aria-label="همکاران خلاق">
          {partners.map((item, index) => {
            const isActive = activeId === item.id;
            const TabTag = edit ? "div" : "button";
            const tabProps = edit
              ? {
                  className: `cp-avatar${isActive ? " cp-avatar--active" : ""}`,
                  onClick: () => setActiveId(item.id),
                  role: "presentation" as const,
                }
              : {
                  type: "button" as const,
                  role: "tab" as const,
                  "aria-selected": isActive,
                  onClick: () => setActiveId(item.id),
                  className: `cp-avatar${isActive ? " cp-avatar--active" : ""}`,
                  title: item.name,
                };

            const tabInner = (
              <>
                {isActive || edit ? (
                  item.avatarVideoSrc && !edit ? (
                    <video
                      src={item.avatarVideoSrc}
                      className="cp-avatar__img"
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="none"
                      aria-hidden
                      {...protectedVideoProps}
                    >
                      <track kind="captions" src="/captions/decorative-fa.vtt" label="بدون گفتار" srcLang="fa" default />
                    </video>
                  ) : (
                    <img
                      src={item.avatarSrc}
                      alt={item.name}
                      className="cp-avatar__img"
                      loading="lazy"
                      decoding="async"
                      {...protectedImageProps}
                    />
                  )
                ) : (
                  <span className="cp-avatar__initial" aria-hidden>
                    {item.name.charAt(0)}
                  </span>
                )}
              </>
            );

            return (
              <CmsCardEditor
                key={item.id}
                title={item.name}
                className="cp-avatar-wrap"
                fields={[
                  {
                    type: "image",
                    path: `creativePartners.${index}.avatarSrc`,
                    label: "تصویر آواتار",
                    src: item.avatarSrc,
                    uploadKind: "creative-partners",
                  },
                  {
                    type: "text",
                    path: `creativePartners.${index}.avatarVideoSrc`,
                    label: "ویدیو آواتار (URL)",
                    dir: "ltr",
                  },
                ]}
              >
                <TabTag {...tabProps}>{tabInner}</TabTag>
              </CmsCardEditor>
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
          >
            <CmsCardEditor
              title={partner.name}
              className="cp-stage-wrap"
              fields={[
                {
                  type: "image",
                  path: `${base}.videoSrc`,
                  label: "ویدیو / تصویر اصلی",
                  src: partner.videoSrc || partner.avatarSrc,
                  uploadKind: "creative-partners",
                },
                {
                  type: "text",
                  path: `${base}.avatarVideoSrc`,
                  label: "ویدیو آواتار (URL)",
                  dir: "ltr",
                },
                { type: "richtext", path: `${base}.name`, label: "نام" },
                { type: "richtext", path: `${base}.role`, label: "نقش" },
                { type: "richtext", path: "landing.creativePartnersShowcaseLabel", label: "برچسب «نمونه کار»" },
                { type: "richtext", path: `${base}.showcase`, label: "نمونه کار" },
                { type: "richtext", path: `${base}.bio`, label: "بیو" },
                { type: "richtext", path: `${base}.quote`, label: "نقل‌قول" },
              ]}
          >
            <div className="cp-stage">
              <div className="cp-copy">
                <EditableText path={`${base}.name`} as="p" className="cp-copy__name">
                  {partner.name}
                </EditableText>
                <EditableText path={`${base}.role`} as="p" className="cp-copy__role">
                  {partner.role}
                </EditableText>
                <span className="cp-copy__showcase">
                  <EditableText path="landing.creativePartnersShowcaseLabel" as="span" inline className="cp-copy__showcase-label">
                    {landing.creativePartnersShowcaseLabel}
                  </EditableText>{" "}
                  <EditableText path={`${base}.showcase`} as="span" inline>
                    {partner.showcase}
                  </EditableText>
                </span>
                <EditableText path={`${base}.bio`} as="p" className="cp-copy__bio">
                  {partner.bio}
                </EditableText>
                <EditableText path={`${base}.quote`} as="p" className="cp-copy__quote">
                  «{partner.quote}»
                </EditableText>
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
            </div>
          </CmsCardEditor>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
