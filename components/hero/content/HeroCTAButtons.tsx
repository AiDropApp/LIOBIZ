"use client";

import EditableCta from "@/components/cms-edit/EditableCta";

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
      <EditableCta
        labelPath="landing.heroPrimaryCta"
        hrefPath="landing.heroPrimaryHref"
        label={primaryLabel || "شروع همکاری"}
        href={primaryHref || "/contact"}
        className="btn-primary"
      />
      <EditableCta
        labelPath="landing.heroSecondaryCta"
        hrefPath="landing.heroSecondaryHref"
        label={secondaryLabel || "مشاهده خدمات"}
        href={secondaryHref || "/#services"}
        className="btn-outline"
      />
    </div>
  );
}
