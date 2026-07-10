"use client";

export default function HeroDescription({ text }: { text?: string }) {
  return (
    <p className="hero-desc text-base leading-8 md:text-[1.02rem] lg:mr-0">
      {text ||
        "تبلیغات خلاقانه، فروش هدفمند و پشتیبانی حرفه‌ای؛ همه در یک مسیر رشد یکپارچه برای برند شما."}
    </p>
  );
}
