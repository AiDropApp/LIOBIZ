"use client";

import { motion } from "framer-motion";
import { Briefcase, Heart, Sparkles, Users } from "lucide-react";

const stats = [
  { value: "120+", label: "پروژه موفق", icon: Briefcase },
  { value: "98%", label: "رضایت مشتری", icon: Heart },
  { value: "50+", label: "مشتری فعال", icon: Users },
  { value: "10+", label: "سال تجربه", icon: Sparkles },
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
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay }}
      className="hero-stats-bar"
    >
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="hero-stats-item">
            <Icon className="mx-auto mb-2 text-primary" size={18} aria-hidden="true" />
          <div className="text-xl font-extrabold text-primary md:text-2xl">{item.value}</div>
          <div className="mt-1 text-sm text-white/65">{item.label}</div>
          </div>
        );
      })}
    </motion.div>
  );
}
