"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import { defaultPlans, type PlanItem } from "@/lib/landing-defaults";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Plans({
  initialLanding,
  initialPlans,
}: {
  initialLanding?: LandingContent;
  initialPlans?: PlanItem[];
} = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [plans, setPlans] = useState<PlanItem[]>(home?.plans ?? initialPlans ?? defaultPlans);

  useEffect(() => {
    if (home?.plans || initialPlans) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.plans)) setPlans(data.plans);
      })
      .catch(() => undefined);
  }, [home?.plans, initialPlans]);

  return (
    <section id="plans" className="section-block bg-white">
      <div className="container mx-auto">
        <LandingSectionHeader
          labelPath="landing.plansLabel"
          titlePath="landing.plansTitle"
          introPath="landing.plansIntro"
          label={landing.plansLabel}
          title={landing.plansTitle}
          intro={landing.plansIntro}
        />

        <div className="plans-grid">
          {plans.map((plan, index) => (
            <CmsCardEditor
              key={plan.id}
              title={plan.name}
              className={`plan-card-wrap ${plan.featured ? "is-featured" : ""}`}
              fields={[
                { type: "richtext", path: `plans.${index}.name`, label: "نام پلن" },
                { type: "richtext", path: `plans.${index}.description`, label: "توضیح کوتاه" },
                { type: "richtext", path: `plans.${index}.price`, label: "قیمت" },
                { type: "text", path: `plans.${index}.ctaLabel`, label: "متن دکمه", plain: true },
                { type: "lines", path: `plans.${index}.features`, label: "ویژگی‌ها (هر خط یک مورد)" },
                { type: "checkbox", path: `plans.${index}.featured`, label: "پلن پیشنهادی (هایلایت)" },
              ]}
            >
              <motion.article
                className={`plan-card ${plan.featured ? "is-featured" : ""}`}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="plan-card-head">
                  <EditableText path={`plans.${index}.name`} as="h3">
                    {plan.name}
                  </EditableText>
                  <EditableText path={`plans.${index}.description`} as="p">
                    {plan.description}
                  </EditableText>
                </div>
                <div className="plan-card-body">
                  <ul className="plan-features">
                    {plan.features.map((feature, fi) => (
                      <li key={`${plan.id}-${fi}`}>
                        <Check size={16} aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="plan-price">
                    <EditableText path={`plans.${index}.price`} as="span" className="font-bold" inline>
                      {plan.price}
                    </EditableText>
                    <EditableText path="landing.planPriceSuffix" inline>
                      {landing.planPriceSuffix}
                    </EditableText>
                  </div>
                  <EditableCta
                    labelPath={`plans.${index}.ctaLabel`}
                    hrefPath="landing.planSelectHref"
                    label={plan.ctaLabel || `${landing.planSelectCta} ${plan.name}`}
                    href={landing.planSelectHref}
                    className={`btn-accent plan-cta ${plan.featured ? "" : "btn-accent--outline"}`}
                  />
                </div>
              </motion.article>
            </CmsCardEditor>
          ))}
        </div>
      </div>
    </section>
  );
}
