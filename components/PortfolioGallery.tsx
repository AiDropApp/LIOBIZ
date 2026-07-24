"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import type { PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import { resolveMediaKind } from "@/lib/media-types";
import { DEFAULT_PORTFOLIO_CATEGORIES, portfolioMatchesCategoryFilter, sortCategories } from "@/lib/portfolio";

const PAGE_SIZE = 16;

export default function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_PORTFOLIO_CATEGORIES);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        if (Array.isArray(data.portfolioCategories) && data.portfolioCategories.length) {
          setCategories(sortCategories(data.portfolioCategories));
        }
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const tabs = useMemo(() => ["همه", ...categories.map((c) => c.name)], [categories]);

  const filtered = useMemo(
    () => (filter === "همه" ? items : items.filter((item) => portfolioMatchesCategoryFilter(item, filter))),
    [filter, items],
  );

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loadMore, filter, visible.length]);

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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.02 }}
                className="portfolio-card group w-full max-w-none"
              >
                <button
                  type="button"
                  className="portfolio-card-trigger"
                  onClick={() => setSelected(item)}
                  aria-label={`مشاهده جزئیات ${item.title}`}
                >
                  <div className="portfolio-card-media">
                    {/* Grid: image/poster only — never mount autoplaying videos */}
                    <CmsMedia
                      image={item.image}
                      mediaKind="image"
                      aspectRatio={item.aspectRatio}
                      alt={item.title}
                      fill
                      fitParent
                      objectFit="cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      priority={index < 4}
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

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-10">
          <button type="button" className="filter-chip" onClick={loadMore}>
            نمایش بیشتر ({visible.length} از {filtered.length})
          </button>
        </div>
      ) : null}

      {visible.length === 0 && (
        <p className="py-16 text-center text-muted">هنوز نمونه‌کاری در این دسته ثبت نشده است.</p>
      )}

      <PortfolioDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
