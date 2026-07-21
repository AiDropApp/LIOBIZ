"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PwaInstallPrompt.module.css";

// ── تنظیمات سایت ──
const APP_NAME = "لیوبیز";
const LOGO_SRC = "/images/logo.png";
const DISMISS_KEY = "liobiz-pwa-install-dismissed";
const INSTALLED_KEY = "liobiz-pwa-installed";
const SHOW_AFTER_MS = 1800;

type Lang = "fa" | "en";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const copy = {
  fa: {
    title: `نصب ${APP_NAME} روی دستگاه`,
    body: `برای دسترسی سریع‌تر، ${APP_NAME} را مثل یک اپ نصب کنید — بدون نیاز به فروشگاه.`,
    ios: "در سافاری روی Share بزنید، سپس Add to Home Screen را انتخاب کنید.",
    desktop: `در Chrome یا Edge از منوی مرورگر گزینه Install ${APP_NAME} / Install app را بزنید.`,
    cta: "نصب برنامه",
    aria: "نصب برنامه",
    close: "بستن",
  },
  en: {
    title: `Install ${APP_NAME} on your device`,
    body: `Install ${APP_NAME} like an app for faster access — no app store needed.`,
    ios: "In Safari tap Share, then Add to Home Screen.",
    desktop: `In Chrome or Edge, open the browser menu and choose Install ${APP_NAME} / Install app.`,
    cta: "Install app",
    aria: "Install app",
    close: "Close",
  },
} as const;

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectLang(): Lang {
  const lang = document.documentElement.lang?.slice(0, 2).toLowerCase();
  return lang === "en" ? "en" : "fa";
}

function readDeferred(): BeforeInstallPromptEvent | null {
  return (window.__liobizPwa?.deferred as BeforeInstallPromptEvent | null) || null;
}

export function PwaInstallPrompt({ lang }: { lang?: Lang } = {}) {
  const pathname = usePathname();
  const t = copy[lang ?? (typeof document !== "undefined" ? detectLang() : "fa")];
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === "1" || isRunningStandalone()) {
      localStorage.setItem(INSTALLED_KEY, "1");
      setHidden(true);
      return;
    }
    setHidden(false);
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const adopt = (bip: BeforeInstallPromptEvent) => {
      window.__liobizPwa = window.__liobizPwa || { deferred: null };
      window.__liobizPwa.deferred = bip;
      setDeferred(bip);
      setVisible(true);
    };

    const existing = readDeferred();
    if (existing) adopt(existing);

    const onAvailable = () => {
      const d = readDeferred();
      if (d) adopt(d);
    };

    const onBip = (e: Event) => {
      e.preventDefault();
      adopt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      sessionStorage.setItem(DISMISS_KEY, "1");
      if (window.__liobizPwa) window.__liobizPwa.deferred = null;
      setDeferred(null);
      setVisible(false);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("liobiz-pwa-available", onAvailable);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("liobiz-pwa-installed", onInstalled);

    const timer = window.setTimeout(() => {
      if (
        localStorage.getItem(INSTALLED_KEY) === "1" ||
        sessionStorage.getItem(DISMISS_KEY) === "1" ||
        isRunningStandalone()
      ) {
        return;
      }
      setVisible(true);
    }, SHOW_AFTER_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("liobiz-pwa-available", onAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("liobiz-pwa-installed", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    const bip = deferred || readDeferred();
    if (!bip) return;
    await bip.prompt();
    const choice = await bip.userChoice;
    setDeferred(null);
    if (window.__liobizPwa) window.__liobizPwa.deferred = null;
    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      sessionStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
      setHidden(true);
    }
  }, [deferred]);

  const isAppShell = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");
  if (isAppShell || hidden || !visible) return null;

  const body = deferred ? t.body : isIos ? t.ios : t.desktop;

  return (
    <div className={styles.wrap} role="dialog" aria-label={t.aria}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt={APP_NAME} width={40} height={40} className={styles.logo} />

        <div className={styles.copy}>
          <p className={styles.title}>{t.title}</p>
          <p className={styles.body}>{body}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={install} className={styles.cta}>
            {t.cta}
          </button>
          <button type="button" onClick={dismiss} className={styles.close} aria-label={t.close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
