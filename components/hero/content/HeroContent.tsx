"use client";

import { motion } from "framer-motion";
import HeroBadge from "./HeroBadge";
import HeroHeading from "./HeroHeading";
import HeroDescription from "./HeroDescription";
import HeroCTAButtons from "./HeroCTAButtons";
import type { LandingContent } from "@/lib/cms-defaults";

export default function HeroContent({
  reducedMotion = false,
  delay = 0,
  landing,
}: {
  reducedMotion?: boolean;
  delay?: number;
  landing?: LandingContent;
}) {
  const item = (extra = 0) =>
    reducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: "easeOut", delay: delay + extra },
        };

  return (
    <div className="hero-content-stack">
      <motion.div {...item(0)}>
        <HeroBadge text={landing?.heroBadge} />
      </motion.div>
      <motion.div {...item(0.08)}>
        <HeroHeading
          title={landing?.heroTitle}
          highlight={landing?.heroTitleHighlight}
        />
      </motion.div>
      <motion.div {...item(0.14)}>
        <HeroDescription text={landing?.heroDescription} />
      </motion.div>
      <motion.div {...item(0.2)}>
        <HeroCTAButtons
          primaryLabel={landing?.heroPrimaryCta}
          primaryHref={landing?.heroPrimaryHref}
          secondaryLabel={landing?.heroSecondaryCta}
          secondaryHref={landing?.heroSecondaryHref}
        />
      </motion.div>
    </div>
  );
}
