"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Headphones,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import { defaultProcessSteps, type ProcessStepItem } from "@/lib/landing-defaults";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
  "trending-up": TrendingUp,
};

export default function Process() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [steps, setSteps] = useState<ProcessStepItem[]>(defaultProcessSteps);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.pages?.processSteps)) setSteps(data.pages.processSteps);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="process" className="section-block bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="section-label">{landing.processLabel}</span>
          <h2 className="section-title">{landing.processTitle}</h2>
          <a
            href={landing.processLinkHref}
            className="mt-4 inline-flex text-sm text-primary transition-colors hover:text-primary-dark"
          >
            {landing.processLinkText}
          </a>
        </motion.div>

        <div className="process-rail">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="process-step"
              >
                <span className="process-step-num">{step.id}</span>
                <div className="process-step-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-base font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
