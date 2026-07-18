"use client";

import { useEffect, useState } from "react";
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
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import CmsRichText from "@/components/CmsRichText";
import { defaultServices, type ServiceItem } from "@/lib/landing-defaults";

const iconMap: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code2,
  share2: Share2,
  "trending-up": TrendingUp,
  pen: PenLine,
};

export default function Services() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.pages?.services)) setServices(data.pages.services);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="services" className="services-strip">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">{landing.servicesLabel}</span>
          <h2 className="section-title text-[1.7rem] md:text-3xl lg:text-[2.2rem]">
            {landing.servicesTitle}
          </h2>
          <CmsRichText content={landing.servicesIntro} className="mx-auto mt-4 max-w-2xl" />
        </motion.div>

        <div className="services-strip-grid">
          {services.map((service, index) => {
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
