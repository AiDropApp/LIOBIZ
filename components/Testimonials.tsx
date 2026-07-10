"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";

export default function Testimonials() {
  return (
    <section className="section-block bg-white" id="testimonials">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="section-label">گواهی مشتریان</span>
          <h2 className="section-title mb-4">وقتی برندها، نتیجه را می‌بینند</h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-muted">
            هر همکاری برای ما یک پروژه‌ی رشد و یک داستان موفقیت است؛ نه فقط یک سفارش.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="lux-card testimonial-card flex flex-col"
            >
              <p className="mb-8 flex-1 leading-8 text-foreground/80">“{item.quote}”</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                  {item.initial}
                </div>
                <div className="testimonial-meta">
                  <h3 className="font-bold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
