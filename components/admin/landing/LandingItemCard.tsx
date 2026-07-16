"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  index: number;
  title: string;
  subtitle?: string;
  previewSrc?: string;
  previewKind?: "image" | "video";
  defaultOpen?: boolean;
  onRemove: () => void;
  children: ReactNode;
};

export default function LandingItemCard({
  index,
  title,
  subtitle,
  previewSrc,
  previewKind = "image",
  defaultOpen = false,
  onRemove,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className={`landing-item-card landing-item-card--collapsible${open ? " is-open" : ""}`}>
      <div className="landing-item-card-head">
        <button
          type="button"
          className="landing-item-card-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {previewSrc ? (
            <span className="landing-item-card-thumb" aria-hidden>
              {previewKind === "video" ? (
                <video src={previewSrc} muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt="" />
              )}
            </span>
          ) : (
            <span className="landing-item-card-thumb landing-item-card-thumb--empty">{index}</span>
          )}
          <span className="landing-item-card-titles">
            <strong>{title || `آیتم ${index}`}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </span>
          <ChevronDown size={18} className="landing-item-card-chevron" aria-hidden />
        </button>
        <button type="button" className="landing-item-remove" onClick={onRemove}>
          حذف
        </button>
      </div>
      {open ? <div className="landing-item-card-body">{children}</div> : null}
    </article>
  );
}
