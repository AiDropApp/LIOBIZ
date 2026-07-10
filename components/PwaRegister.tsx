"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const cleanup = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // ignore
      }
    };

    cleanup();
  }, []);

  return null;
}
