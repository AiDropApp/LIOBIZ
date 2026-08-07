"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import CmsArrayActions from "@/components/cms-edit/CmsArrayActions";
import { defaultPartners, type PartnerItem } from "@/lib/landing-defaults";

export default function Partners({
  initialLanding,
  initialPartners,
}: {
  initialLanding?: LandingContent;
  initialPartners?: PartnerItem[];
} = {}) {
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [partners, setPartners] = useState<PartnerItem[]>(
    home?.partners ?? initialPartners ?? defaultPartners,
  );

  useEffect(() => {
    if (home?.partners || initialPartners) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.partners)) setPartners(data.partners);
      })
      .catch(() => undefined);
  }, [home?.partners, initialPartners]);

  const items = partners;

  return (
    <section className="section-block bg-background-soft" id="partners">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.partnersLabel"
            titlePath="landing.partnersTitle"
            label={landing.partnersLabel}
            title={landing.partnersTitle}
            className="mb-10 text-center"
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {items.map((partner, index) => {
            const chip = (
              <EditableText path={`partners.${index}.logo`} as="span" inline>
                {partner.logo}
              </EditableText>
            );

            const inner = partner.href?.trim() ? (
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
            );

            return (
              <motion.div
                key={`${partner.name}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="relative"
              >
                <CmsArrayActions
                  path="partners"
                  emptyItem={{ name: "", logo: "", href: "" }}
                  index={index}
                  onRemove={() => undefined}
                  className="cms-edit-array-remove--corner"
                />
                <CmsCardEditor
                  title={partner.name || partner.logo}
                  className="partner-chip-wrap"
                  fields={[
                    { type: "richtext", path: `partners.${index}.logo`, label: "متن لوگو / برند" },
                    { type: "text", path: `partners.${index}.name`, label: "نام (title)" },
                    { type: "text", path: `partners.${index}.href`, label: "لینk", dir: "ltr" },
                  ]}
                >
                  {inner}
                </CmsCardEditor>
              </motion.div>
            );
          })}
        </div>
        <CmsArrayActions path="partners" emptyItem={{ name: "", logo: "", href: "" }} addLabel="+ افزودن برند" className="mt-4" />
      </div>
    </section>
  );
}
