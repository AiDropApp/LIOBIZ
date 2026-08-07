"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
};

export default function TurnstileField({ siteKey, onToken, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const mount = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
        theme: "auto",
      });
    };

    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (window.turnstile) {
      mount();
      return;
    }

    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.setAttribute("src", "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
      script.setAttribute("async", "true");
      script.setAttribute("defer", "true");
      document.head.appendChild(script);
    }
    script.addEventListener("load", mount);

    return () => {
      script.removeEventListener("load", mount);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken, onExpire]);

  return <div ref={containerRef} className="turnstile-wrap" />;
}
