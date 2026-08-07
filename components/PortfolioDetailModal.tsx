"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CmsMedia from "@/components/CmsMedia";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
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
  itemIndex,
  onClose,
}: {
  item: PortfolioItem | null;
  itemIndex: number | null;
  onClose: () => void;
}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode && itemIndex != null && itemIndex >= 0;
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, []);

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
  const full = item?.imageFull?.trim() || "";
  const detailImage = full && full !== "/images/logo.png" ? full : item?.image || "";
  const base = itemIndex != null && itemIndex >= 0 ? `portfolio.${itemIndex}` : null;

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
                  image={detailImage}
                  videoSrc={item.videoSrc}
                  mediaKind={item.mediaKind}
                  aspectRatio={item.aspectRatio ?? "portrait"}
                  alt={item.title}
                  natural
                  controls
                  objectFit="contain"
                  priority
                />
              </div>

              <div className="portfolio-detail-info">
                {edit && base ? (
                  <EditableText path={`${base}.category`} className="portfolio-detail-category">
                    {item.category}
                  </EditableText>
                ) : (
                  <span className="portfolio-detail-category">{item.category}</span>
                )}
                {edit && base ? (
                  <EditableText
                    path={`${base}.title`}
                    as="h2"
                    className="portfolio-detail-title"
                  >
                    {item.title}
                  </EditableText>
                ) : (
                  <h2 id="portfolio-detail-title" className="portfolio-detail-title">
                    {item.title}
                  </h2>
                )}
                {edit && base ? (
                  <EditableText path={`${base}.description`} as="p" className="portfolio-detail-desc" multiline>
                    {meta.description}
                  </EditableText>
                ) : (
                  <p className="portfolio-detail-desc">{meta.description}</p>
                )}

                <dl className="portfolio-detail-meta">
                  <div>
                    <dt>
                      <EditableText path="landing.portfolioModalCategoryLabel">{landing.portfolioModalCategoryLabel}</EditableText>
                    </dt>
                    <dd>{edit && base ? <EditableText path={`${base}.category`}>{item.category}</EditableText> : item.category}</dd>
                  </div>
                  <div>
                    <dt>
                      <EditableText path="landing.portfolioModalClientLabel">{landing.portfolioModalClientLabel}</EditableText>
                    </dt>
                    <dd>
                      {edit && base ? (
                        <EditableText path={`${base}.client`}>{meta.client}</EditableText>
                      ) : (
                        meta.client
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <EditableText path="landing.portfolioModalYearLabel">{landing.portfolioModalYearLabel}</EditableText>
                    </dt>
                    <dd>
                      {edit && base ? <EditableText path={`${base}.year`}>{meta.year}</EditableText> : meta.year}
                    </dd>
                  </div>
                </dl>

                <EditableCta
                  labelPath="landing.portfolioModalCta"
                  hrefPath="landing.portfolioModalCtaHref"
                  label={landing.portfolioModalCta}
                  href={landing.portfolioModalCtaHref}
                  className="btn-primary portfolio-detail-cta"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
