"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import { defaultPartners, type PartnerItem } from "@/lib/landing-defaults";

export default function Partners() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [partners, setPartners] = useState<PartnerItem[]>(defaultPartners);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.partners)) setPartners(data.partners);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="section-block bg-background-soft" id="partners">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="section-label">{landing.partnersLabel}</span>
          <h2 className="section-title">{landing.partnersTitle}</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {partners.map((partner, index) => {
            const chip = (
              <>
                <span>{partner.logo}</span>
              </>
            );

            return (
              <motion.div
                key={`${partner.name}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                {partner.href?.trim() ? (
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="partner-chip partner-chip--link"
                    title={partner.name}
                  >
                    {chip}
                  </a>
                ) : (
                  <div className="partner-chip" title={partner.name}>
                    {chip}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
