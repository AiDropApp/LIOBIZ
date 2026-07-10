"use client";

import { motion } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const dots = [
  { left: "10%", top: "18%", delay: 0 },
  { left: "25%", top: "55%", delay: 0.8 },
  { left: "70%", top: "22%", delay: 1.2 },
  { left: "82%", top: "62%", delay: 1.6 },
  { left: "45%", top: "12%", delay: 0.4 },
];

export default function AmbientGlow() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {dots.map((dot, index) => (
        <motion.div
          key={index}
          className="hero-ambient-glow"
          style={{ left: dot.left, top: dot.top }}
          animate={reduced ? undefined : { y: [0, -8, 0], opacity: [0.55, 0.9, 0.55] }}
          transition={{
            duration: 5 + index * 0.35,
            ease: "easeInOut",
            repeat: Infinity,
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}
