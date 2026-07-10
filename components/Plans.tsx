"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { PLANS } from "@/lib/constants";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Plans() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section id="plans" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">پلن‌های همکاری</span>
          <h2 className="section-title">مسیر رشد متناسب با برند شما</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            سه سطح همکاری شفاف؛ از شروع حرفه‌ای تا همراهی جامع برای مقیاس‌پذیری برند.
          </p>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan, index) => (
            <motion.article
              key={plan.id}
              className={`plan-card ${plan.featured ? "is-featured" : ""}`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="plan-card-head">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <div className="plan-card-body">
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="plan-price">
                  <strong>{plan.price}</strong>
                  <span>تومان / ماه</span>
                </div>
                <Link href="/contact" className="btn-primary plan-cta">
                  شروع همکاری
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
