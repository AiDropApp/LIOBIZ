"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FAQ() {
  return (
    <section id="faq" className="section-block bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">سوالات متداول</span>
          <h2 className="section-title">پاسخ سوالات پرتکرار شما</h2>
        </motion.div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => (
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
