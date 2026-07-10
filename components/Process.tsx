"use client";

import { motion } from "framer-motion";
import {
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { PROCESS_STEPS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
};

export default function Process() {
  return (
    <section id="process" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="section-label">فرآیند همکاری</span>
          <h2 className="section-title">از ایده تا رشد پایدار</h2>
          <a href="/process" className="mt-4 inline-flex text-sm text-primary transition-colors hover:text-primary-dark">
            جزئیات فرآیند همکاری
          </a>
        </motion.div>

        <div className="process-rail">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="process-step lux-card"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{step.id}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
