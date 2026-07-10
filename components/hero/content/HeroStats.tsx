"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "120+", label: "پروژه موفق" },
  { value: "98%", label: "رضایت مشتری" },
  { value: "10+", label: "سال تجربه" },
];

export default function HeroStats({
  reducedMotion = false,
  delay = 0,
}: {
  reducedMotion?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay }}
      className="hero-stats-bar"
    >
      {stats.map((item) => (
        <div key={item.label} className="hero-stats-item">
          <div className="text-xl font-semibold text-primary-light md:text-2xl">{item.value}</div>
          <div className="mt-1 text-sm text-white/65">{item.label}</div>
        </div>
      ))}
    </motion.div>
  );
}
