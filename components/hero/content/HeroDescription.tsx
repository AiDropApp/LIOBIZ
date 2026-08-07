"use client";

import EditableRichText from "@/components/cms-edit/EditableRichText";

export default function HeroDescription({ text }: { text?: string }) {
  const fallback =
    "تبلیغات خلاقانه، فروش هدفمند و پشتیبانی حرفه‌ای؛ همه در یک مسیر رشد یکپارچه برای برند شما.";

  return (
    <EditableRichText
      path="landing.heroDescription"
      fallback={text?.trim() ? text : fallback}
      className="hero-desc text-base md:text-[1.02rem]"
      paragraphClassName="hero-desc text-base leading-8 md:text-[1.02rem]"
    />
  );
}
