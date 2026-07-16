"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CmsMedia from "@/components/CmsMedia";
import type { PortfolioItem } from "@/lib/content-store";

function portfolioMeta(item: PortfolioItem) {
  const description =
    item.description?.trim() ||
    `پروژه «${item.title}» در دسته ${item.category} توسط تیم لیوبیز طراحی و اجرا شده است؛ با تمرکز بر هویت برند، کیفیت بصری و نتیجه قابل‌اندازه‌گیری.`;

  return {
    description,
    client: item.client?.trim() || "محرمانه / برند همکار",
    year: item.year?.trim() || "—",
  };
}

export default function PortfolioDetailModal({
  item,
  onClose,
}: {
  item: PortfolioItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  if (typeof document === "undefined") return null;

  const meta = item ? portfolioMeta(item) : null;

  return createPortal(
    <AnimatePresence>
      {item && meta && (
        <motion.div
          className="portfolio-detail-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            className="portfolio-detail-backdrop"
            aria-label="بستن"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-detail-title"
            className="portfolio-detail-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <button
              type="button"
              className="portfolio-detail-close"
              onClick={onClose}
              aria-label="بستن جزئیات"
            >
              <X size={20} />
            </button>

            <div className="portfolio-detail-grid">
              <div className="portfolio-detail-media">
                <CmsMedia
                  image={item.image}
                  videoSrc={item.videoSrc}
                  mediaKind={item.mediaKind}
                  aspectRatio={item.aspectRatio ?? "portrait"}
                  alt={item.title}
                  fill
                  fitParent
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain"
                  priority
                />
              </div>

              <div className="portfolio-detail-info">
                <span className="portfolio-detail-category">{item.category}</span>
                <h2 id="portfolio-detail-title" className="portfolio-detail-title">
                  {item.title}
                </h2>
                <p className="portfolio-detail-desc">{meta.description}</p>

                <dl className="portfolio-detail-meta">
                  <div>
                    <dt>دسته‌بندی</dt>
                    <dd>{item.category}</dd>
                  </div>
                  <div>
                    <dt>کارفرما</dt>
                    <dd>{meta.client}</dd>
                  </div>
                  <div>
                    <dt>سال</dt>
                    <dd>{meta.year}</dd>
                  </div>
                </dl>

                <a href="/contact" className="btn-primary portfolio-detail-cta">
                  سفارش پروژه مشابه
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
