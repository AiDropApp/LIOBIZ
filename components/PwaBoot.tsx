"use client";

/**
 * Captures beforeinstallprompt as early as possible (before React children hydrate).
 * Chrome may fire this event once; missing it means Install button does nothing.
 */
export default function PwaBoot() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  try {
    window.__liobizPwa = window.__liobizPwa || { deferred: null };
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window.__liobizPwa.deferred = e;
      window.dispatchEvent(new CustomEvent("liobiz-pwa-available"));
    });
    window.addEventListener("appinstalled", function () {
      window.__liobizPwa.deferred = null;
      window.dispatchEvent(new CustomEvent("liobiz-pwa-installed"));
    });
  } catch (err) {}
})();
        `.trim(),
      }}
    />
  );
}

declare global {
  interface Window {
    __liobizPwa?: {
      deferred: (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
      }) | null;
    };
  }
}
