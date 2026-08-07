"use client";

import EditableText from "@/components/cms-edit/EditableText";

export default function HeroHeading({
  brand,
  title,
  highlight,
  part3,
  part4,
}: {
  brand?: string;
  title?: string;
  highlight?: string;
  part3?: string;
  part4?: string;
}) {
  return (
    <>
      <p className="hero-eyebrow">
        <EditableText path="landing.heroTitleBrand" as="span">
          {brand || "لیوبیز"}
        </EditableText>
      </p>
      <h1 className="hero-heading text-[2.25rem] font-black leading-[1.22] tracking-tight md:text-[2.75rem] xl:text-[3.35rem] xl:leading-[1.18]">
        <EditableText path="landing.heroTitle" as="span">
          {title || "ما رشد"}
        </EditableText>{" "}
        <EditableText path="landing.heroTitleHighlight" as="span">
          {highlight || "کسب‌وکار شما"}
        </EditableText>{" "}
        <EditableText path="landing.heroTitlePart3" as="span">
          {part3 || "را"}
        </EditableText>
        <br />
        <EditableText path="landing.heroTitlePart4" as="span">
          {part4 || "می‌سازیم"}
        </EditableText>
      </h1>
    </>
  );
}
