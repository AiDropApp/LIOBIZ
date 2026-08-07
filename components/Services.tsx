"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Code2,
  Share2,
  TrendingUp,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { LandingContent } from "@/lib/cms-defaults";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import { defaultServices, type ServiceItem } from "@/lib/landing-defaults";
import { getServiceLinkLabel } from "@/lib/seo-nav-labels";

const iconMap: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code2,
  share2: Share2,
  "trending-up": TrendingUp,
  pen: PenLine,
};

export default function Services({
  initialLanding,
}: {
  initialLanding?: LandingContent;
} = {}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.pages?.services)) setServices(data.pages.services);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="services" className="services-strip">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.servicesLabel"
            titlePath="landing.servicesTitle"
            introPath="landing.servicesIntro"
            label={landing.servicesLabel}
            title={landing.servicesTitle}
            intro={landing.servicesIntro}
            titleClassName="section-title text-[1.7rem] md:text-3xl lg:text-[2.2rem]"
          />
        </motion.div>

        <div className="services-strip-grid">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] ?? Palette;
            const card = (
              <>
                <span className="service-mini-icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={1.75} />
                </span>
                <EditableText path={`pages.services.${index}.title`} as="h3">
                  {service.title}
                </EditableText>
                <EditableText path={`pages.services.${index}.description`} as="p">
                  {service.description}
                </EditableText>
              </>
            );

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <CmsCardEditor
                  title={service.title}
                  className="service-mini-card-wrap"
                  fields={[
                    { type: "richtext", path: `pages.services.${index}.title`, label: "عنوان" },
                    { type: "richtext", path: `pages.services.${index}.description`, label: "توضیحات" },
                    { type: "text", path: `pages.services.${index}.href`, label: "لینk صفحه", dir: "ltr" },
                    { type: "text", path: `pages.services.${index}.icon`, label: "کلید آیکon", dir: "ltr" },
                  ]}
                >
                  {edit ? (
                    <div className="service-mini-card">{card}</div>
                  ) : (
                    <article className="service-mini-card">
                      <span className="service-mini-icon" aria-hidden="true">
                        <Icon size={26} strokeWidth={1.75} />
                      </span>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                      <Link href={service.href} className="service-mini-card-link">
                        {getServiceLinkLabel(service.href, service.slug, service.title, "card")}
                      </Link>
                    </article>
                  )}
                </CmsCardEditor>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
