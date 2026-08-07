"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import EditableText from "@/components/cms-edit/EditableText";
import EditableImage from "@/components/cms-edit/EditableImage";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import type { PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import { resolveMediaKind } from "@/lib/media-types";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import { normalizePortfolioCategories, portfolioMatchesCategoryFilter } from "@/lib/portfolio";

const PAGE_SIZE = 16;

export default function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        setCategories(normalizePortfolioCategories(data.portfolioCategories));
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        setCategoriesReady(true);
      })
      .catch(() => {
        setItems([]);
        setCategoriesReady(true);
      });
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const tabs = useMemo(() => categories, [categories]);

  const filterAll = landing.portfolioFilterAll || "همه";

  useEffect(() => {
    if (filter === filterAll) return;
    const valid = tabs.some((cat) => cat.name === filter);
    if (!valid) setFilter(filterAll);
  }, [filter, tabs, filterAll]);

  const filtered = useMemo(
    () => (filter === filterAll ? items : items.filter((item) => portfolioMatchesCategoryFilter(item, filter))),
    [filter, items, filterAll],
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
        {edit ? (
          <div
            className={`filter-chip ${filter === filterAll ? "is-active" : ""}`}
            role="presentation"
          >
            <EditableText path="landing.portfolioFilterAll" inline>
              {filterAll}
            </EditableText>
          </div>
        ) : (
          <button
            type="button"
            role="tab"
            id="gallery-tab-all"
            aria-selected={filter === filterAll}
            aria-controls="gallery-panel"
            onClick={() => setFilter(filterAll)}
            className={`filter-chip ${filter === filterAll ? "is-active" : ""}`}
          >
            {filterAll}
          </button>
        )}
        {categoriesReady
          ? tabs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                id={`gallery-tab-${cat.id}`}
                aria-selected={filter === cat.name}
                aria-controls="gallery-panel"
                onClick={() => setFilter(cat.name)}
                className={`filter-chip ${filter === cat.name ? "is-active" : ""}`}
              >
                {cat.name}
              </button>
            ))
          : null}
      </div>

      <div
        id="gallery-panel"
        role="tabpanel"
        aria-labelledby="gallery-tab-all"
        className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => {
            const globalIndex = items.findIndex((p) => p.id === item.id);
            const isVideo = resolveMediaKind(item) === "video" && Boolean(item.videoSrc);
            const TriggerTag = edit ? "div" : "button";
            const triggerProps = edit
              ? { className: "portfolio-card-trigger w-full text-right" }
              : {
                  type: "button" as const,
                  className: "portfolio-card-trigger w-full text-right",
                  onClick: () => {
                    setSelected(item);
                    setSelectedIndex(globalIndex);
                  },
                  "aria-label": `مشاهده جزئیات ${item.title}`,
                };

            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.02 }}
                className="portfolio-card group w-full max-w-none cms-editable-card"
              >
                <TriggerTag {...triggerProps}>
                  <div className="portfolio-card-media">
                    {edit && globalIndex >= 0 ? (
                      <EditableImage
                        path={`portfolio.${globalIndex}.image`}
                        src={item.image}
                        alt={item.title}
                        fill
                        fillParent
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        uploadKind="about"
                      />
                    ) : (
                      <CmsMedia
                        image={item.image}
                        mediaKind="image"
                        aspectRatio={item.aspectRatio}
                        alt={item.title}
                        fill
                        fitParent
                        objectFit="cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    {isVideo ? (
                      <span className="portfolio-card-play" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                      </span>
                    ) : null}
                    <div className="portfolio-card-overlay" />
                    <div className="portfolio-card-meta">
                      {edit && globalIndex >= 0 ? (
                        <>
                          <EditableText path={`portfolio.${globalIndex}.category`} as="p">
                            {item.category}
                          </EditableText>
                          <EditableText path={`portfolio.${globalIndex}.title`} as="h3">
                            {item.title}
                          </EditableText>
                        </>
                      ) : (
                        <>
                          <p>{item.category}</p>
                          <h3>{item.title}</h3>
                        </>
                      )}
                    </div>
                  </div>
                </TriggerTag>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {edit ? (
            <div className="filter-chip">
              <EditableText path="landing.portfolioLoadMoreLabel" inline>
                {landing.portfolioLoadMoreLabel}
              </EditableText>
              {" "}
              ({visible.length} از {filtered.length})
            </div>
          ) : (
            <button type="button" className="filter-chip" onClick={loadMore}>
              {landing.portfolioLoadMoreLabel} ({visible.length} از {filtered.length})
            </button>
          )}
        </div>
      ) : null}

      {visible.length === 0 && (
        <p className="py-16 text-center text-muted">
          <EditableText path="landing.portfolioEmptyText">{landing.portfolioEmptyText}</EditableText>
        </p>
      )}

      <PortfolioDetailModal
        item={selected}
        itemIndex={selectedIndex}
        onClose={() => {
          setSelected(null);
          setSelectedIndex(null);
        }}
      />
    </div>
  );
}
