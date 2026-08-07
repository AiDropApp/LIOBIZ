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
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import { defaultProcessSteps, type ProcessStepItem } from "@/lib/landing-defaults";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
  "trending-up": TrendingUp,
};

export default function Process({
  initialLanding,
  initialSteps,
}: {
  initialLanding?: LandingContent;
  initialSteps?: ProcessStepItem[];
} = {}) {
  const cms = useCmsEdit();
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [steps, setSteps] = useState<ProcessStepItem[]>(
    home?.processSteps ?? initialSteps ?? defaultProcessSteps,
  );

  useEffect(() => {
    if (home?.processSteps || initialSteps) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.pages?.processSteps)) setSteps(data.pages.processSteps);
      })
      .catch(() => undefined);
  }, [home?.processSteps, initialSteps]);

  const showProcessLink =
    Boolean(landing.processLinkHref?.trim() || landing.processLinkText?.trim()) ||
    Boolean(cms?.isAdmin && cms.editMode);

  return (
    <section id="process" className="section-block bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.processLabel"
            titlePath="landing.processTitle"
            introPath="landing.processIntro"
            label={landing.processLabel}
            title={landing.processTitle}
            intro={landing.processIntro}
            className="mb-14 text-center"
          />
          {showProcessLink ? (
            cms?.isAdmin && cms.editMode ? (
              <div className="mt-4 inline-flex flex-col items-center gap-1">
                <EditableText path="landing.processLinkText" as="span" className="text-sm text-primary">
                  {landing.processLinkText}
                </EditableText>
                <EditableText path="landing.processLinkHref" dir="ltr" className="cms-cta-href">
                  {landing.processLinkHref}
                </EditableText>
              </div>
            ) : (
              <a
                href={landing.processLinkHref}
                className="mt-4 inline-flex text-sm text-primary transition-colors hover:text-primary-dark"
              >
                {landing.processLinkText}
              </a>
            )
          ) : null}
        </motion.div>

        <div className="process-rail">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <CmsCardEditor
                key={step.id}
                title={step.title}
                className="process-step-wrap"
                fields={[
                  { type: "richtext", path: `pages.processSteps.${index}.title`, label: "عنوان" },
                  { type: "richtext", path: `pages.processSteps.${index}.description`, label: "توضیحات" },
                  { type: "text", path: `pages.processSteps.${index}.icon`, label: "کلید آیکon", dir: "ltr", plain: true },
                ]}
              >
                <motion.div
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
                  <EditableText path={`pages.processSteps.${index}.title`} as="p" className="process-step-title mb-2 text-base font-bold">
                    {step.title}
                  </EditableText>
                  <EditableText path={`pages.processSteps.${index}.description`} as="p" className="text-sm leading-relaxed text-muted">
                    {step.description}
                  </EditableText>
                </motion.div>
              </CmsCardEditor>
            );
          })}
        </div>
      </div>
    </section>
  );
}
