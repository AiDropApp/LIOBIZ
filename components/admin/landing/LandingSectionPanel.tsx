"use client";

import { ChevronDown } from "lucide-react";

type Props = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
};

export default function LandingSectionPanel({
  id,
  emoji,
  title,
  subtitle,
  open,
  onToggle,
  children,
  onSave,
  saving,
}: Props) {
  return (
    <article id={id} className={`landing-section-panel${open ? " is-open" : ""}`}>
      <button type="button" className="landing-section-head" onClick={onToggle}>
        <span className="landing-section-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="landing-section-titles">
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <ChevronDown className={`landing-section-chevron${open ? " rotate" : ""}`} size={20} />
      </button>
      {open && (
        <div className="landing-section-body">
          {children}
          {onSave && (
            <div className="landing-section-actions">
              <button type="button" className="btn-primary" disabled={saving} onClick={onSave}>
                {saving ? "در حال ذخیره..." : "ذخیره این بخش"}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
