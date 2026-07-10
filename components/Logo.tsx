"use client";

import Image from "next/image";

export default function Logo({
  className = "",
  width = 150,
}: {
  className?: string;
  width?: number;
}) {
  const height = Math.round(width * 0.32);

  return (
    <a href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="لیوبیز">
      <Image
        src="/images/logo.png"
        alt="liobiz"
        width={width}
        height={height}
        priority={width >= 150}
        className="h-auto object-contain"
        style={{ width }}
      />
    </a>
  );
}
