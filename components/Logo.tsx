"use client";

import Image from "next/image";

export default function Logo({
  className = "",
  width,
  height,
  src = "/images/logo.webp",
}: {
  className?: string;
  width?: number;
  height?: number;
  src?: string;
}) {
  const w = width ?? (height ? Math.round(height * 0.87) : 120);
  const h = height ?? Math.round(w * 1.15);

  return (
    <a
      href="/"
      className={`header-logo inline-flex shrink-0 items-center ${className}`}
      aria-label="بازگشت به صفحه اصلی لیوبیز"
    >
      <Image
        src={src}
        alt="لوگوی لیوبیز"
        width={w}
        height={h}
        priority={false}
        loading="lazy"
        sizes="(max-width: 768px) 80px, 120px"
        unoptimized={src.startsWith("/api/media/")}
        className="header-logo-image object-contain"
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
        }}
      />
    </a>
  );
}
