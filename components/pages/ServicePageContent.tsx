"use client";

import { CheckCircle2 } from "lucide-react";
import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import EditableText from "@/components/cms-edit/EditableText";
import EditableRichText from "@/components/cms-edit/EditableRichText";
import EditableCta from "@/components/cms-edit/EditableCta";
import CmsEditPopover from "@/components/cms-edit/CmsEditPopover";
import type { ServicePageContent } from "@/lib/pages-content";

type Props = {
  service: ServicePageContent;
  index: number;
};

export default function ServicePageContent({ service, index }: Props) {
  const base = `servicePages.${index}`;

  return (
    <>
      <EditablePageHero
        labelPath={`${base}.label`}
        titlePath={`${base}.headline`}
        introPath={`${base}.intro`}
        label={service.label}
        title={service.headline}
        intro={service.intro}
      />

      <section className="service-layout mb-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <div className="service-panel lux-card cms-editable-card">
          <EditableText path={`${base}.audienceHeading`} as="h2" className="mb-4 text-xl font-bold">
            {service.audienceHeading}
          </EditableText>
          <EditableRichText
            path={`${base}.audience`}
            fallback={service.audience}
            paragraphClassName="leading-relaxed text-muted"
          />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {service.outcomes.map((item, outcomeIndex) => (
              <li key={item} className="service-chip cms-editable-card">
                <CheckCircle2 size={16} className="service-chip-icon" aria-hidden="true" />
                <EditableText path={`${base}.outcomes.${outcomeIndex}`} as="span">
                  {item}
                </EditableText>
              </li>
            ))}
          </ul>
          <CmsEditPopover
            className="mt-3"
            buttonLabel="📋 outcomes"
            fields={[{ path: `${base}.outcomes`, label: "هر خط = یک outcome", linesToArray: true }]}
          />
        </div>
        <div className="service-cta-card lux-card cms-editable-card flex flex-col justify-between">
          <div>
            <EditableText path={`${base}.title`} as="h2" className="mb-3 text-xl font-bold">
              {service.title}
            </EditableText>
            <EditableText path={`${base}.ctaBlurb`} as="p" className="leading-relaxed text-muted" multiline>
              {service.ctaBlurb}
            </EditableText>
          </div>
          <EditableCta
            labelPath={`${base}.contactCta`}
            hrefPath={`${base}.contactHref`}
            label={service.contactCta}
            href={service.contactHref}
            className="btn-accent mt-8 w-full justify-center py-3.5"
          />
        </div>
      </section>

      <section className="mb-12">
        <EditableText path={`${base}.deliverablesHeading`} as="h2" className="mb-6 text-center text-2xl font-bold">
          {service.deliverablesHeading}
        </EditableText>
        <div className="grid gap-5 sm:grid-cols-2">
          {service.deliverables.map((item, deliverableIndex) => (
            <article key={item.title} className="service-deliverable lux-card cms-editable-card">
              <EditableText
                path={`${base}.deliverables.${deliverableIndex}.title`}
                as="h3"
                className="mb-2 text-lg font-bold"
              >
                {item.title}
              </EditableText>
              <EditableRichText
                path={`${base}.deliverables.${deliverableIndex}.description`}
                fallback={item.description}
                paragraphClassName="leading-relaxed text-muted"
              />
            </article>
          ))}
        </div>
      </section>

      <section>
        <EditableText path={`${base}.processHeading`} as="h2" className="mb-6 text-center text-2xl font-bold">
          {service.processHeading}
        </EditableText>
        <div className="service-process-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {service.process.map((step, stepIndex) => (
            <article key={step.title} className="service-step lux-card cms-editable-card">
              <span className="service-step-num">{String(stepIndex + 1).padStart(2, "0")}</span>
              <EditableText path={`${base}.process.${stepIndex}.title`} as="h3" className="mb-2 text-lg font-bold">
                {step.title}
              </EditableText>
              <EditableRichText
                path={`${base}.process.${stepIndex}.description`}
                fallback={step.description}
                paragraphClassName="text-sm leading-relaxed text-muted"
              />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
