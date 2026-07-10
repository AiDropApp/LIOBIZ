"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Code2,
  Share2,
  TrendingUp,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code2,
  share2: Share2,
  "trending-up": TrendingUp,
  pen: PenLine,
};

export default function Services() {
  return (
    <section id="services" className="services-strip">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">خدمات ما</span>
          <h2 className="section-title text-[1.7rem] md:text-3xl lg:text-[2.2rem]">
            راهکارهای جامع برای رشد کسب‌وکار شما
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            از هویت برند تا تبلیغات و محتوا؛ همه خدمات در یک مسیر هماهنگ.
          </p>
        </motion.div>

        <div className="services-strip-grid">
          {SERVICES.map((service, index) => {
            const Icon = iconMap[service.icon] ?? Palette;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <Link href={service.href} className="service-mini-card">
                  <span className="service-mini-icon" aria-hidden="true">
                    <Icon size={26} strokeWidth={1.75} />
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
