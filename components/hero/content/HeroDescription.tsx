"use client";

import CmsRichText from "@/components/CmsRichText";

export default function HeroDescription({ text }: { text?: string }) {
  const fallback =
    "تبلیغات خلاقانه، فروش هدفمند و پشتیبانی حرفه‌ای؛ همه در یک مسیر رشد یکپارچه برای برند شما.";

  return (
    <CmsRichText
      content={text || fallback}
      className="hero-desc text-base md:text-[1.02rem]"
      paragraphClassName="hero-desc text-base leading-8 md:text-[1.02rem]"
    />
  );
}
