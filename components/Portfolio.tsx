"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import { PORTFOLIO_FILTERS } from "@/lib/constants";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import type { PortfolioItem } from "@/lib/content-store";

const LANDING_LIMIT = 8;

export default function Portfolio() {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => setItems([]));
  }, []);

  const visible = useMemo(() => {
    const filtered =
      filter === "همه" ? items : items.filter((item) => item.category === filter);
    return filtered.slice(0, LANDING_LIMIT);
  }, [filter, items]);

  return (
    <section id="portfolio" className="portfolio-section section-block">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="section-label">{landing.portfolioLabel}</span>
          <h2 className="section-title">{landing.portfolioTitle}</h2>
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
          {PORTFOLIO_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`filter-chip ${filter === item ? "is-active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="portfolio-grid" aria-label="نمونه کارهای منتخب">
          <AnimatePresence mode="popLayout">
            {visible.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="portfolio-card group"
              >
                <button
                  type="button"
                  className="portfolio-card-trigger w-full text-right"
                  onClick={() => setSelected(item)}
                  aria-label={`مشاهده جزئیات ${item.title}`}
                >
                  <div className="relative">
                    <CmsMedia
                      image={item.image}
                      videoSrc={item.videoSrc}
                      mediaKind={item.mediaKind}
                      aspectRatio={item.aspectRatio}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="portfolio-card-overlay" />
                    <div className="portfolio-card-meta">
                      <p>{item.category}</p>
                      <h3>{item.title}</h3>
                    </div>
                  </div>
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/portfolio" className="btn-accent px-12">
            مشاهده همه پروژه‌ها
          </Link>
        </div>
      </div>

      <PortfolioDetailModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
