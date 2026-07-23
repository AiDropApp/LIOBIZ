"use client";

import { useEffect } from "react";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { isPwaSuppressedPath } from "@/lib/pwa-paths";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("liobiz-")).forEach((key) => caches.delete(key));
        });
      }
      return;
    }
    if (!("serviceWorker" in navigator)) return;
    const path = window.location.pathname;
    if (isPwaSuppressedPath(path)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // First visit: SW installed but not yet controlling — one soft reload unlocks installability.
        if (!navigator.serviceWorker.controller && !sessionStorage.getItem("liobiz-sw-reloaded")) {
          sessionStorage.setItem("liobiz-sw-reloaded", "1");
          window.location.reload();
          return;
        }

        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch (err) {
        if (!cancelled) console.warn("[PWA] SW register failed", err);
      }
    };

    register();
    return () => {
      cancelled = true;
    };
  }, []);

  return <PwaInstallPrompt lang="fa" />;
}
