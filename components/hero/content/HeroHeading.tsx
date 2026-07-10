"use client";

export default function HeroHeading({
  title,
  highlight,
}: {
  title?: string;
  highlight?: string;
}) {
  return (
    <h1 className="hero-heading text-[2.25rem] font-black leading-[1.22] tracking-tight md:text-[2.75rem] xl:text-[3.35rem] xl:leading-[1.18]">
      {title || "ما رشد"}{" "}
      <span>{highlight || "کسب‌وکار شما"}</span>
      {" "}را
      <br />
      می‌سازیم
    </h1>
  );
}
