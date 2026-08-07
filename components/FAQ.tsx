"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import { defaultFaq, type FaqItem } from "@/lib/landing-defaults";

export default function FAQ({
  initialLanding,
  initialFaq,
}: {
  initialLanding?: LandingContent;
  initialFaq?: FaqItem[];
} = {}) {
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [faq, setFaq] = useState<FaqItem[]>(home?.faq ?? initialFaq ?? defaultFaq);

  useEffect(() => {
    if (home?.faq || initialFaq) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.faq)) setFaq(data.faq);
      })
      .catch(() => undefined);
  }, [home?.faq, initialFaq]);

  return (
    <section id="faq" className="section-block bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.faqLabel"
            titlePath="landing.faqTitle"
            introPath="landing.faqIntro"
            label={landing.faqLabel}
            title={landing.faqTitle}
            intro={landing.faqIntro}
          />
        </motion.div>

        <div className="faq-list">
          {faq.map((item, index) => (
            <CmsCardEditor
              key={item.q}
              title={item.q}
              className="faq-item-wrap"
              fields={[
                { type: "richtext", path: `faq.${index}.q`, label: "سؤال" },
                { type: "richtext", path: `faq.${index}.a`, label: "پاسخ" },
              ]}
            >
              <motion.details
                className="faq-item"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <summary>
                  <EditableText path={`faq.${index}.q`} as="span" inline>
                    {item.q}
                  </EditableText>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <EditableText path={`faq.${index}.a`} as="div" className="leading-8 text-muted">
                  {item.a}
                </EditableText>
              </motion.details>
            </CmsCardEditor>
          ))}
        </div>
      </div>
    </section>
  );
}
