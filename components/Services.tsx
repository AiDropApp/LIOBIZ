"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Code2,
  Share2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code2,
  share2: Share2,
  "trending-up": TrendingUp,
};

export default function Services() {
  return (
    <section id="services" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="section-label">خدمات ما</span>
          <h2 className="section-title">موتور رشد برند شما</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            از هویت بصری تا تبلیغات و رشد؛ همه چیز را در یک چرخهٔ هماهنگ طراحی و اجرا می‌کنیم.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map((service, index) => {
            const Icon = iconMap[service.icon] ?? Palette;
            const featured = index === 1;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Link
                  href={service.href}
                  className={`lux-card group block h-full ${featured ? "lux-card--featured" : ""}`}
                >
                  <div className="lux-card-shine" aria-hidden="true" />
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-medium text-white/35">{service.id}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{service.title}</h3>
                  <p className="mb-4 leading-relaxed text-muted">{service.description}</p>
                  <span className="text-sm font-medium text-primary-soft">مشاهده جزئیات ←</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
