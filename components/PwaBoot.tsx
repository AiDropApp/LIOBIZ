import Script from "next/script";

/**
 * Captures beforeinstallprompt as early as possible (before React children hydrate).
 * Chrome may fire this event once; missing it means Install button does nothing.
 */
export default function PwaBoot({ nonce }: { nonce?: string }) {
  return (
    <Script id="pwa-boot" strategy="afterInteractive" nonce={nonce}>
      {`
(function () {
  try {
    var path = window.location.pathname || "";
    var suppressed =
      path.indexOf("/admin") === 0 ||
      path.indexOf("/dashboard") === 0 ||
      path.indexOf("/login") === 0 ||
      path.indexOf("/register") === 0;
    if (suppressed) return;

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
      `.trim()}
    </Script>
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
