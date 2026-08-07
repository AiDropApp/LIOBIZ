"use client";

import { useEffect, type RefObject } from "react";
import { lockPageScroll } from "@/lib/modal-scroll-lock";

export function useModalScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return lockPageScroll();
  }, [active]);
}

/** Ensure wheel scroll works inside a modal panel when smooth-scroll (Lenis) is active. */
export function useScrollContainerWheel(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (el.scrollHeight <= el.clientHeight + 1) return;

      const delta = e.deltaY;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const next = el.scrollTop + delta;

      if ((delta < 0 && el.scrollTop <= 0) || (delta > 0 && el.scrollTop >= maxScroll)) {
        e.preventDefault();
        el.scrollTop = Math.max(0, Math.min(maxScroll, next));
        return;
      }

      e.preventDefault();
      el.scrollTop = next;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref, active]);
}
