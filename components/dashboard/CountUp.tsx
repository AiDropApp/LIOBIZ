"use client";

import { useEffect, useState } from "react";

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
};

export default function CountUp({ value, duration = 900, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplay(0);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const target = Math.max(0, Math.round(value));

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <strong className={className} aria-live="polite">
      {display.toLocaleString("fa-IR")}
    </strong>
  );
}
