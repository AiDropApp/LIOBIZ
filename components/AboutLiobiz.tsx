"use client";

import { motion } from "framer-motion";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import EditableRichText from "@/components/cms-edit/EditableRichText";
import EditableImage from "@/components/cms-edit/EditableImage";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import type { LandingContent } from "@/lib/cms-defaults";

export default function AboutLiobiz({ initialLanding }: { initialLanding?: LandingContent }) {
  const landing = useHomeLanding(initialLanding);

  return (
    <section id="about-liobiz" className="about-liobiz section-block">
      <div className="container mx-auto">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 text-center lg:order-1 lg:text-right"
          >
            <EditableText path="landing.aboutLabel" className="section-label">
              {landing.aboutLabel}
            </EditableText>
            <EditableText path="landing.aboutTitle" as="h2" className="section-title mt-2 text-[1.75rem] md:text-3xl lg:text-[2.35rem]">
              {landing.aboutTitle}
            </EditableText>
            <EditableRichText
              path="landing.aboutText1"
              fallback={landing.aboutText1}
              className="mx-auto mt-5 max-w-xl lg:mx-0"
              paragraphClassName="text-muted leading-8"
            />
            <EditableRichText
              path="landing.aboutText2"
              fallback={landing.aboutText2}
              className="mx-auto mt-4 max-w-xl lg:mx-0"
              paragraphClassName="text-muted leading-8"
            />
            <EditableCta
              labelPath="landing.aboutLinkCta"
              hrefPath="landing.aboutLinkHref"
              label={landing.aboutLinkCta}
              href={landing.aboutLinkHref}
              className="btn-accent btn-accent--black mt-8"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="about-liobiz-visual order-1 lg:order-2"
          >
            <div className="about-liobiz-main">
              <EditableImage
                path="landing.aboutImage1"
                src={landing.aboutImage1}
                alt="فضای کار لیوبیز"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                uploadKind="about"
              />
            </div>
            <div className="about-liobiz-float">
              <EditableImage
                path="landing.aboutImage2"
                src={landing.aboutImage2}
                alt="جلسه تیم لیوبیز"
                fill
                className="object-cover"
                sizes="280px"
                uploadKind="about"
              />
            </div>
            <EditableText path="landing.aboutBadge" className="about-liobiz-badge">
              {landing.aboutBadge}
            </EditableText>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
