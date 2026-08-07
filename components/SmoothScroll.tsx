"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

/** Defer Lenis/GSAP smooth scroll until after idle — reduces initial JS work for PageSpeed. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    if (reduced || narrow) return;

    const activate = () => setEnabled(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(activate, 1500);
    return () => clearTimeout(t);
  }, []);

  if (!enabled) return <>{children}</>;

  return <SmoothScrollInner>{children}</SmoothScrollInner>;
}

function SmoothScrollInner({ children }: { children: ReactNode }) {
  const [Inner, setInner] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    void import("./SmoothScrollInner").then((mod) => setInner(() => mod.default));
  }, []);

  if (!Inner) return <>{children}</>;
  return <Inner>{children}</Inner>;
}
