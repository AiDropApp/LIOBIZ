"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ContentImage from "@/components/ContentImage";
import CmsRichText from "@/components/CmsRichText";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";

export default function AboutLiobiz() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, []);

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
            <span className="section-label">{landing.aboutLabel}</span>
            <h2 className="section-title mt-2 text-[1.75rem] md:text-3xl lg:text-[2.35rem]">
              {landing.aboutTitle}
            </h2>
            <CmsRichText
              content={landing.aboutText1}
              className="mx-auto mt-5 max-w-xl lg:mx-0"
              paragraphClassName="text-muted leading-8"
            />
            <CmsRichText
              content={landing.aboutText2}
              className="mx-auto mt-4 max-w-xl lg:mx-0"
              paragraphClassName="text-muted leading-8"
            />
            <Link href="/about" className="btn-accent btn-accent--black mt-8">
              بیشتر درباره ما
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="about-liobiz-visual order-1 lg:order-2"
          >
            <div className="about-liobiz-main">
              <ContentImage
                src={landing.aboutImage1}
                alt="فضای کار لیوبیز"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority={false}
              />
            </div>
            <div className="about-liobiz-float">
              <ContentImage
                src={landing.aboutImage2}
                alt="جلسه تیم لیوبیز"
                fill
                className="object-cover"
                sizes="280px"
              />
            </div>
            <div className="about-liobiz-badge">{landing.aboutBadge}</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
