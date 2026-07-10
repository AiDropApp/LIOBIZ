"use client";

export default function HeroBadge({ text }: { text?: string }) {
  return <span className="hero-badge">{text || "آژانس رشد کسب‌وکار"}</span>;
}
