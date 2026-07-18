"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import CmsRichText from "@/components/CmsRichText";
import { defaultFaq, type FaqItem } from "@/lib/landing-defaults";

export default function FAQ() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [faq, setFaq] = useState<FaqItem[]>(defaultFaq);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.faq)) setFaq(data.faq);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="faq" className="section-block bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">{landing.faqLabel}</span>
          <h2 className="section-title">{landing.faqTitle}</h2>
          <CmsRichText content={landing.faqIntro} className="mx-auto mt-4 max-w-2xl" />
        </motion.div>

        <div className="faq-list">
          {faq.map((item, index) => (
            <motion.details
              key={item.q}
              className="faq-item"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <summary>
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
