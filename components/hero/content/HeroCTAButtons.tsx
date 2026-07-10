"use client";

import Link from "next/link";

export default function HeroCTAButtons({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <div className="hero-cta-row">
      <Link className="btn-primary" href={primaryHref || "/contact"}>
        {primaryLabel || "شروع همکاری"}
      </Link>
      <Link className="btn-outline" href={secondaryHref || "/#services"}>
        {secondaryLabel || "مشاهده خدمات"}
      </Link>
    </div>
  );
}
