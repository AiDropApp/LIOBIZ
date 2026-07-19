"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import type { PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import { resolveMediaKind } from "@/lib/media-types";
import { DEFAULT_PORTFOLIO_CATEGORIES, sortCategories } from "@/lib/portfolio";

const LANDING_LIMIT = 8;

export default function Portfolio() {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_PORTFOLIO_CATEGORIES);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        if (Array.isArray(data.portfolioCategories) && data.portfolioCategories.length) {
          setCategories(sortCategories(data.portfolioCategories));
        }
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => setItems([]));
  }, []);

  const tabs = useMemo(() => ["همه", ...categories.map((c) => c.name)], [categories]);

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
          {landing.portfolioLabel?.trim() ? (
            <span className="section-label">{landing.portfolioLabel}</span>
          ) : null}
          {landing.portfolioTitle?.trim() ? (
            <h2 className="section-title">{landing.portfolioTitle}</h2>
          ) : null}
        </motion.div>

        <div className="filter-chip-track mb-8" role="tablist" aria-label="فیلتر نمونه کارها">
          {tabs.map((item) => (
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
            {visible.map((item, index) => {
              const isVideo = resolveMediaKind(item) === "video" && Boolean(item.videoSrc);
              return (
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
                    <div className="portfolio-card-media">
                      <CmsMedia
                        image={item.image}
                        videoSrc={item.videoSrc}
                        mediaKind={item.mediaKind}
                        aspectRatio={item.aspectRatio}
                        alt={item.title}
                        fill
                        fitParent
                        objectFit="cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                      {isVideo ? (
                        <span className="portfolio-card-play" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7L8 5z" />
                          </svg>
                        </span>
                      ) : null}
                      <div className="portfolio-card-overlay" />
                      <div className="portfolio-card-meta">
                        <p>{item.category}</p>
                        <h3>{item.title}</h3>
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link href="/portfolio" className="btn-accent portfolio-all-cta">
            مشاهده همه پروژه‌ها
          </Link>
        </div>
      </div>

      <PortfolioDetailModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
