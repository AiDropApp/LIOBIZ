"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import CmsArrayActions from "@/components/cms-edit/CmsArrayActions";
import { defaultTestimonials, type TestimonialItem } from "@/lib/landing-defaults";

export default function Testimonials({
  initialLanding,
  initialTestimonials,
}: {
  initialLanding?: LandingContent;
  initialTestimonials?: TestimonialItem[];
} = {}) {
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    home?.testimonials ?? initialTestimonials ?? defaultTestimonials,
  );

  useEffect(() => {
    if (home?.testimonials || initialTestimonials) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.testimonials)) setTestimonials(data.testimonials);
      })
      .catch(() => undefined);
  }, [home?.testimonials, initialTestimonials]);

  const items = testimonials;

  return (
    <section className="section-block bg-white" id="testimonials">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.testimonialsLabel"
            titlePath="landing.testimonialsTitle"
            introPath="landing.testimonialsIntro"
            label={landing.testimonialsLabel}
            title={landing.testimonialsTitle}
            intro={landing.testimonialsIntro}
            className="mb-14 text-center"
            titleClassName="section-title mb-4"
          />
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => (
            <CmsCardEditor
              key={`${item.name}-${index}`}
              title={item.name}
              className="testimonial-card-wrap relative"
              fields={[
                { type: "richtext", path: `testimonials.${index}.quote`, label: "نظر مشتری" },
                { type: "richtext", path: `testimonials.${index}.name`, label: "نام" },
                { type: "richtext", path: `testimonials.${index}.role`, label: "سمت / برند" },
              ]}
            >
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="lux-card testimonial-card relative flex flex-col"
              >
                <CmsArrayActions
                  path="testimonials"
                  emptyItem={{ name: "", role: "", quote: "" }}
                  index={index}
                  onRemove={() => undefined}
                />
                <EditableText path={`testimonials.${index}.quote`} as="p" className="mb-8 flex-1 leading-8 text-foreground/80">
                  «{item.quote}»
                </EditableText>
                <div className="testimonial-meta">
                  <EditableText path={`testimonials.${index}.name`} as="p" className="font-bold text-foreground">
                    {item.name}
                  </EditableText>
                  <EditableText path={`testimonials.${index}.role`} as="p" className="text-sm text-muted">
                    {item.role}
                  </EditableText>
                </div>
              </motion.div>
            </CmsCardEditor>
          ))}
        </div>
        <CmsArrayActions path="testimonials" emptyItem={{ name: "", role: "", quote: "" }} addLabel="+ افزودن نظر" className="mt-4" />
      </div>
    </section>
  );
}
