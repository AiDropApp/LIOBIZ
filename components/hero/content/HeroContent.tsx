"use client";

import { motion } from "framer-motion";
import HeroBadge from "./HeroBadge";
import HeroHeading from "./HeroHeading";
import HeroDescription from "./HeroDescription";
import HeroCTAButtons from "./HeroCTAButtons";
import HeroStats from "./HeroStats";

export default function HeroContent({
  reducedMotion = false,
  delay = 0,
}: {
  reducedMotion?: boolean;
  delay?: number;
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
    <div className="order-2 text-center lg:order-1 lg:text-right">
      <motion.div {...item(0)}>
        <HeroBadge />
      </motion.div>
      <motion.div {...item(0.08)}>
        <HeroHeading />
      </motion.div>
      <motion.div {...item(0.14)}>
        <HeroDescription />
      </motion.div>
      <motion.div {...item(0.2)}>
        <HeroCTAButtons />
      </motion.div>
      <HeroStats reducedMotion={reducedMotion} delay={delay + 0.28} />
    </div>
  );
}
