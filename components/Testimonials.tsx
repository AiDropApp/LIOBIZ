"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import { defaultTestimonials, type TestimonialItem } from "@/lib/landing-defaults";

export default function Testimonials() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(defaultTestimonials);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.testimonials)) setTestimonials(data.testimonials);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="section-block bg-white" id="testimonials">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="section-label">{landing.testimonialsLabel}</span>
          <h2 className="section-title mb-4">{landing.testimonialsTitle}</h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-muted">{landing.testimonialsIntro}</p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={`${item.name}-${index}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="lux-card testimonial-card flex flex-col"
            >
              <p className="mb-8 flex-1 leading-8 text-foreground/80">«{item.quote}»</p>
              <div className="testimonial-meta">
                <h3 className="font-bold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
