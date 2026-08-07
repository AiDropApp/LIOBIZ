"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CmsMedia from "@/components/CmsMedia";
import PortfolioDetailModal from "@/components/PortfolioDetailModal";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import type { PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import { resolveMediaKind } from "@/lib/media-types";
import { normalizePortfolioCategories, portfolioMatchesCategoryFilter } from "@/lib/portfolio";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import EditableImage from "@/components/cms-edit/EditableImage";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

import { HOME_PORTFOLIO_LIMIT } from "@/lib/homepage-limits";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";

type PortfolioProps = {
  initialLanding?: LandingContent;
  initialItems?: PortfolioItem[];
  initialCategories?: PortfolioCategory[];
};

export default function Portfolio({
  initialLanding,
  initialItems,
  initialCategories,
}: PortfolioProps = {}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const [filter, setFilter] = useState("همه");
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [items, setItems] = useState<PortfolioItem[]>(home?.portfolio ?? initialItems ?? []);
  const [categories, setCategories] = useState<PortfolioCategory[]>(
    home?.portfolioCategories ?? initialCategories ?? [],
  );
  const [categoriesReady, setCategoriesReady] = useState(
    Boolean((home?.portfolioCategories ?? initialCategories)?.length),
  );
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (home?.portfolio || (initialItems && initialCategories)) return;
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.portfolio) ? data.portfolio : []);
        setCategories(normalizePortfolioCategories(data.portfolioCategories));
        setCategoriesReady(true);
      })
      .catch(() => {
        setItems([]);
        setCategoriesReady(true);
      });
  }, [home?.portfolio, initialItems, initialCategories]);

  const tabs = useMemo(
    () =>
      categories.filter((cat) =>
        items.some((item) => portfolioMatchesCategoryFilter(item, cat.name, categories)),
      ),
    [categories, items],
  );

  const filterAll = landing.portfolioFilterAll || "همه";

  useEffect(() => {
    if (filter === filterAll) return;
    const valid = tabs.some((cat) => cat.name === filter);
    if (!valid) setFilter(filterAll);
  }, [filter, tabs, filterAll]);

  const visible = useMemo(() => {
    const filtered =
      filter === filterAll
        ? items
        : items.filter((item) => portfolioMatchesCategoryFilter(item, filter, categories));
    return filtered.slice(0, HOME_PORTFOLIO_LIMIT);
  }, [filter, items, filterAll, categories]);

  return (
    <section id="portfolio" className="portfolio-section section-block">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.portfolioLabel"
            titlePath="landing.portfolioTitle"
            label={landing.portfolioLabel}
            title={landing.portfolioTitle}
            className="mb-10 text-center"
          />
        </motion.div>

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
              id="portfolio-tab-all"
              aria-selected={filter === filterAll}
              aria-controls="portfolio-panel"
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
                  id={`portfolio-tab-${cat.id}`}
                  aria-selected={filter === cat.name}
                  aria-controls="portfolio-panel"
                  onClick={() => setFilter(cat.name)}
                  className={`filter-chip ${filter === cat.name ? "is-active" : ""}`}
                >
                  {cat.name}
                </button>
              ))
            : null}
        </div>

        <div
          id="portfolio-panel"
          role="tabpanel"
          aria-labelledby="portfolio-tab-all"
          className={`portfolio-grid${visible.length > 0 && visible.length < 4 ? " portfolio-grid--compact" : ""}`}
          data-count={visible.length}
          aria-label="نمونه کارهای منتخب"
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
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.02 }}
                  className="portfolio-card group cms-editable-card"
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

        <div className="mt-10 flex justify-center sm:mt-12">
          <EditableCta
            labelPath="landing.portfolioViewAllCta"
            hrefPath="landing.portfolioViewAllHref"
            label={landing.portfolioViewAllCta}
            href={landing.portfolioViewAllHref}
            className="btn-accent portfolio-all-cta"
          />
        </div>
      </div>

      <PortfolioDetailModal
        item={selected}
        itemIndex={selectedIndex}
        onClose={() => {
          setSelected(null);
          setSelectedIndex(null);
        }}
      />
    </section>
  );
}
