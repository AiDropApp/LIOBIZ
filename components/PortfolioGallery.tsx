"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import { PORTFOLIO_FILTERS } from "@/lib/constants";
import type { PortfolioItem } from "@/lib/content-store";

export default function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data.portfolio) ? data.portfolio : []))
      .catch(() => setItems([]));
  }, []);

  const visible =
    filter === "همه" ? items : items.filter((item) => item.category === filter);

  return (
    <div>
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

      <div className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => (
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
                <div className="relative">
                  <CmsMedia
                    image={item.image}
                    videoSrc={item.videoSrc}
                    mediaKind={item.mediaKind}
                    aspectRatio={item.aspectRatio ?? "portrait"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="portfolio-card-overlay" />
                  <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
                    <p className="mb-1 text-xs text-primary-soft md:text-sm">{item.category}</p>
                    <h3 className="text-base font-bold text-white md:text-lg">{item.title}</h3>
                  </div>
                </div>
              </button>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && (
        <p className="py-16 text-center text-muted">هنوز نمونه‌کاری در این دسته ثبت نشده است.</p>
      )}

      <PortfolioDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
