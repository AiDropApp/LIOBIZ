"use client";

import { motion } from "framer-motion";
import { Heart, Clock, Users, Briefcase, type LucideIcon } from "lucide-react";
import { STATS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  clock: Clock,
  users: Users,
  briefcase: Briefcase,
};

export default function Stats() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="trust-strip">
          {STATS.map((stat, index) => {
            const Icon = iconMap[stat.icon] ?? Heart;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="trust-strip-item"
              >
                <Icon className="mb-2 text-primary" size={20} />
                <div className="text-2xl font-black text-primary-light md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
