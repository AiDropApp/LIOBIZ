"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ContentImage from "@/components/ContentImage";
import { PORTFOLIO_FILTERS } from "@/lib/constants";
import type { PortfolioItem } from "@/lib/content-store";

export default function Portfolio() {
  const [filter, setFilter] = useState("همه");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data.portfolio) ? data.portfolio : []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [filter]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const visible =
    filter === "همه" ? items : items.filter((item) => item.category === filter);

  return (
    <section id="portfolio" className="portfolio-section py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="section-label">نمونه کارها</span>
          <h2 className="section-title">آثاری که برندها را جلو بردند</h2>
          <a href="/portfolio" className="mt-4 inline-flex text-sm text-primary-soft transition-colors hover:text-white">
            مشاهده همه نمونه کارها
          </a>
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
      </div>

      <div ref={trackRef} className="portfolio-album" aria-label="آلبوم نمونه کارها">
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
              <div className="relative aspect-[3/4] overflow-hidden">
                <ContentImage
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 220px, 260px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="portfolio-card-overlay" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
                  <p className="mb-1 text-xs text-primary-soft md:text-sm">{item.category}</p>
                  <h3 className="text-base font-bold text-white md:text-lg">{item.title}</h3>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
