"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  Heart,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { defaultLanding } from "@/lib/cms-defaults";
import { defaultHeroStats } from "@/lib/landing-defaults";

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  clock: Clock,
  users: Users,
  briefcase: Briefcase,
  sparkles: Sparkles,
};

export default function HeroStats({
  reducedMotion = false,
  delay = 0,
}: {
  reducedMotion?: boolean;
  delay?: number;
}) {
  const [stats, setStats] = useState(defaultHeroStats);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) {
          const merged = { ...defaultLanding, ...data.landing };
          if (Array.isArray(merged.heroStats) && merged.heroStats.length > 0) {
            setStats(merged.heroStats);
          }
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay }}
      className="hero-stats-bar"
    >
      {stats.map((item) => {
        const Icon = iconMap[item.icon] ?? Briefcase;
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
