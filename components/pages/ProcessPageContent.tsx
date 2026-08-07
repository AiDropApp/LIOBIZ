"use client";

import {
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Headphones,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import type { PagesContent } from "@/lib/content-store";
import type { ProcessStepItem } from "@/lib/landing-defaults";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
  "trending-up": TrendingUp,
};

type Props = {
  process: PagesContent["process"];
  steps: ProcessStepItem[];
};

export default function ProcessPageContent({ process, steps }: Props) {
  return (
    <>
      <EditablePageHero
        labelPath="pages.process.label"
        titlePath="pages.process.title"
        introPath="pages.process.intro"
        label={process.label}
        title={process.title}
        intro={process.intro}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = iconMap[step.icon] ?? Search;
          return (
            <article key={step.id} className="service-deliverable lux-card cms-editable-card grid gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <span className="service-step-num">{step.id}</span>
                  <EditableText path={`pages.processSteps.${index}.title`} as="h2" className="text-xl font-bold">
                    {step.title}
                  </EditableText>
                </div>
                <EditableText
                  path={`pages.processSteps.${index}.description`}
                  as="p"
                  className="leading-relaxed text-muted"
                  multiline
                >
                  {step.description}
                </EditableText>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <EditableCta
          labelPath="pages.process.contactCta"
          hrefPath="pages.process.contactHref"
          label={process.contactCta}
          href={process.contactHref}
          className="btn-accent px-8 py-3.5"
        />
      </div>
    </>
  );
}
