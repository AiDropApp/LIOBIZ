"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import type { PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import { resolveMediaKind } from "@/lib/media-types";
import { DEFAULT_PORTFOLIO_CATEGORIES, sortCategories } from "@/lib/portfolio";

export default function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_PORTFOLIO_CATEGORIES);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        if (Array.isArray(data.portfolioCategories) && data.portfolioCategories.length) {
          setCategories(sortCategories(data.portfolioCategories));
        }
      })
      .catch(() => setItems([]));
  }, []);

  const tabs = useMemo(() => ["همه", ...categories.map((c) => c.name)], [categories]);

  const visible =
    filter === "همه" ? items : items.filter((item) => item.category === filter);

  return (
    <div>
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

      <div
        className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => {
            const isVideo = resolveMediaKind(item) === "video" && Boolean(item.videoSrc);
            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="portfolio-card group w-full max-w-none"
              >
                <button
                  type="button"
                  className="portfolio-card-trigger"
                  onClick={() => setSelected(item)}
                  aria-label={`مشاهده جزئیات ${item.title}`}
                >
                  <div className="portfolio-card-media">
                    <CmsMedia
                      image={item.image}
                      alt={item.title}
                      mediaKind="image"
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

      {visible.length === 0 && (
        <p className="py-16 text-center text-muted">هنوز نمونه‌کاری در این دسته ثبت نشده است.</p>
      )}

      <PortfolioDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
