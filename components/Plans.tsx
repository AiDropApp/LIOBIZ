"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import CmsRichText from "@/components/CmsRichText";
import { defaultPlans, type PlanItem } from "@/lib/landing-defaults";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Plans() {
  const reducedMotion = usePrefersReducedMotion();
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [plans, setPlans] = useState<PlanItem[]>(defaultPlans);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.plans)) setPlans(data.plans);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="plans" className="section-block bg-white">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <span className="section-label">{landing.plansLabel}</span>
          <h2 className="section-title">{landing.plansTitle}</h2>
          <CmsRichText content={landing.plansIntro} className="mx-auto mt-4 max-w-2xl" />
        </div>

        <div className="plans-grid">
          {plans.map((plan, index) => (
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
                <Link
                  href="/contact"
                  className={`btn-accent plan-cta ${plan.featured ? "" : "btn-accent--outline"}`}
                >
                  انتخاب پلن
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
