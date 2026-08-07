"use client";

import { useEffect, useState, type ComponentType } from "react";

type Props = { nonce?: string };

type AnalyticsModules = {
  GTM: ComponentType<{ nonce?: string }>;
  CS: ComponentType<{ nonce?: string }>;
  FB: ComponentType<{ nonce?: string }>;
};

const INTERACTION_EVENTS = ["scroll", "click", "touchstart", "keydown"] as const;

/** Load third-party analytics after first interaction or idle to improve TTFB and PageSpeed. */
export default function DeferredAnalytics({ nonce }: Props) {
  const [ready, setReady] = useState(false);
  const [modules, setModules] = useState<AnalyticsModules | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let fallbackId: ReturnType<typeof setTimeout> | undefined;

    const activate = () => {
      if (cancelled) return;
      setReady(true);
    };

    const onFirstSignal = () => {
      INTERACTION_EVENTS.forEach((event) =>
        window.removeEventListener(event, onFirstSignal, { capture: true }),
      );
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackId !== undefined) clearTimeout(fallbackId);
      activate();
    };

    INTERACTION_EVENTS.forEach((event) =>
      window.addEventListener(event, onFirstSignal, { once: true, passive: true, capture: true }),
    );

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(onFirstSignal, { timeout: 5000 });
    } else {
      fallbackId = setTimeout(onFirstSignal, 5000);
    }

    return () => {
      cancelled = true;
      INTERACTION_EVENTS.forEach((event) =>
        window.removeEventListener(event, onFirstSignal, { capture: true }),
      );
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackId !== undefined) clearTimeout(fallbackId);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void Promise.all([
      import("@/components/GoogleTagManager"),
      import("@/components/ContentsquareAnalytics"),
      import("@/components/FacebookPixel"),
    ]).then(([gtm, cs, fb]) => {
      setModules({ GTM: gtm.default, CS: cs.default, FB: fb.default });
    });
  }, [ready]);

  if (!ready || !modules) return null;

  const { GTM, CS, FB } = modules;
  return (
    <>
      <GTM nonce={nonce} />
      <CS nonce={nonce} />
      <FB nonce={nonce} />
    </>
  );
}
