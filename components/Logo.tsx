"use client";

import Image from "next/image";

export default function Logo({
  className = "",
  width,
  height,
  src = "/images/logo.png",
}: {
  className?: string;
  width?: number;
  height?: number;
  src?: string;
}) {
  const h = height ?? (width ? Math.round(width * 1.15) : 120);
  const w = width ?? Math.round(h * 0.9);

  return (
    <a
      href="/"
      className={`header-logo inline-flex shrink-0 items-center ${className}`}
      aria-label="لیوبیز"
    >
      <Image
        src={src}
        alt="liobiz"
        width={w}
        height={h}
        priority
        unoptimized={src.startsWith("/api/media/")}
        className="header-logo-image object-contain"
        style={height ? { height, width: "auto" } : { width: w, height: "auto" }}
      />
    </a>
  );
}
