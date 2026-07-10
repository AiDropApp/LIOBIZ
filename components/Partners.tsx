"use client";

import { motion } from "framer-motion";
import { PARTNERS } from "@/lib/constants";

export default function Partners() {
  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="section-label">همکاران ما</span>
          <h2 className="section-title">برندهایی که به ما اعتماد کردند</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {PARTNERS.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="partner-chip"
            >
              <span>{partner.logo}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
