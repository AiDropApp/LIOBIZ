"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28" id="testimonials">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
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
              className="lux-card"
            >
              <div className="mb-6 h-1 w-16 rounded-full bg-gradient-to-l from-primary to-warm/60" />
              <p className="mb-8 leading-8 text-white/78">“{item.quote}”</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-sm font-bold text-primary-light">
                  {item.initial}
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.name}</h3>
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
