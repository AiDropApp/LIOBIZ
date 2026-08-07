/** Shared security headers for middleware + next.config (static/CDN responses). */

const CONNECT_HOSTS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.contentsquare.net",
  "https://challenges.cloudflare.com",
  "https://cloudflareinsights.com",
  "https://*.cloudflareinsights.com",
  "https://connect.facebook.net",
  "https://www.facebook.com",
];

const SCRIPT_HOSTS = [
  "https://static.cloudflareinsights.com",
  "https://connect.facebook.net",
];

const FRAME_HOSTS = [
  "https://www.googletagmanager.com",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://challenges.cloudflare.com",
  "https://drive.google.com",
  "https://my.files.ir",
  "https://files.ir",
  "https://www.aparat.com",
  "https://player.vimeo.com",
];

/**
 * Strict per-request CSP for actual page responses (set by middleware with a real nonce).
 * `'strict-dynamic'` lets scripts loaded by our nonce'd bundle (GTM's own injected tags,
 * the Turnstile widget script appended via DOM APIs) run without listing every 3rd-party
 * domain individually. `https:` + `'unsafe-inline'` are kept only as no-op fallbacks for
 * legacy browsers that don't understand nonce/strict-dynamic — modern browsers ignore them
 * whenever a nonce is present in the same directive.
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    isDev ? "'unsafe-eval'" : "",
    ...SCRIPT_HOSTS,
    "https:",
    "'unsafe-inline'",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `script-src-elem 'self' 'nonce-${nonce}' ${SCRIPT_HOSTS.join(" ")} https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${CONNECT_HOSTS.join(" ")}${isDev ? " ws: http://localhost:*" : ""}`,
    `frame-src 'self' ${FRAME_HOSTS.join(" ")}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Non-CSP security headers, identical on every response. CSP itself is intentionally
 * NOT included here: it's set per-request by middleware with a real nonce. Setting a
 * second (nonce-less) CSP header here as well as in middleware would cause the browser
 * to enforce both simultaneously and block every nonce'd script, since a plain 'self'
 * script-src has no way to allow inline/nonce'd scripts.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Resource-Policy": "same-site",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/** Used by next.config.ts headers() as a baseline for every response (assets included). */
export function securityHeaderEntries(): Array<{ key: string; value: string }> {
  return Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value }));
}
