# Lighthouse Remediation Plan — liobiz.com

> **Baseline:** PageSpeed / Lighthouse report — 7 Aug 2026, 10:56 AM (Desktop + Mobile)  
> **Live BUILD_ID (server):** check `/var/www/liobiz/.next/BUILD_ID` before each deploy  
> **Rule:** Finish one phase completely (code + tests + verification) before starting the next.

---

## Current scores (baseline)

| Category | Desktop | Mobile | Target |
|----------|---------|--------|--------|
| Performance | 43 | 47 | ≥ 75 |
| Accessibility | 92 | 92 | ≥ 95 |
| Best Practices | 92 | 92 | ≥ 95 |
| SEO | 100 | 100 | 100 |
| Agentic Browsing | 1/3 | 1/3 | 3/3 |

---

## Workflow (mandatory for every phase)

```
1. Sync local ↔ server (Phase 0 only once, then before each deploy)
2. Implement changes on local branch
3. Run automated checks (see Testing section)
4. Build locally: pnpm build (must pass)
5. Deploy safe patch OR scp changed files + rebuild on server
6. Verify on production URL with same Lighthouse mode (Desktop/Mobile)
7. Mark phase DONE only when acceptance criteria met
8. Proceed to next phase
```

**Never:** full `deploy-full.tar` that overwrites `data/`, `media/`, `.env.local`.

---

## Phase 0 — Sync server → local (prerequisite)

### Goal
Local codebase matches production source before any fix.

### Actions
```powershell
# From d:\liobiz\liobiz
$REMOTE = "liobiz:/var/www/liobiz"
$LOCAL = "d:\liobiz\liobiz"

# Pull source (exclude runtime data)
scp -r liobiz:/var/www/liobiz/app $LOCAL/   # or rsync on server side
# Prefer: scripts/apply-seo-patch-on-server.sh in reverse — pull list:
# app, components, hooks, lib, next.config.ts, package.json, pnpm-lock.yaml, public/llms.txt
```

Or on server:
```bash
cd /var/www/liobiz
tar cf /tmp/liobiz-src-sync.tar \
  --exclude=node_modules --exclude=.next --exclude=data \
  --exclude=public/media --exclude=.env.local \
  app components hooks lib next.config.ts package.json pnpm-lock.yaml public scripts
```

### Acceptance criteria
- [ ] `package.json` on local includes server-only deps (e.g. `@tiptap/core`)
- [ ] `app/layout.tsx` matches server (single keywords via `SeoKeywordsMeta`)
- [ ] `pnpm install && pnpm build` succeeds locally
- [ ] Document server BUILD_ID in this file

### Tests
- `pnpm build` — exit 0
- `git diff --stat` — review unexpected drift

---

## Phase 1 — Quick wins (low risk, high audit impact)

**Estimated impact:** Accessibility 92→96+, Best Practices 92→95+, small Performance gain  
**Files:** see checklist below

### 1.1 — Stop unconditional `/api/auth/me` (401 console noise)

| Item | Detail |
|------|--------|
| **Problem** | `CmsEditProvider` fetches `/api/auth/me` on every page → 401 for guests |
| **Files** | `components/cms-edit/CmsEditProvider.tsx`, `components/SiteShell.tsx`, `app/api/auth/me/route.ts` |
| **Fix** | Server-resolve `isAdmin` in `SiteShell` (read session server-side); pass `initialIsAdmin` to provider; skip client fetch when `false` |
| **Acceptance** | Lighthouse / DevTools Network: no `/api/auth/me` on homepage when logged out |
| **Tests** | Manual: logged-out → no auth/me request; logged-in admin → single 200 |

### 1.2 — Portfolio filter ARIA (`tablist` without `tab`)

| Item | Detail |
|------|--------|
| **Problem** | `role="tablist"` on chips without `role="tab"` |
| **Files** | `components/Portfolio.tsx`, `components/PortfolioGallery.tsx` |
| **Fix** | Add `role="tab"`, `aria-selected`, `id`, `aria-controls`; panel `role="tabpanel"` — mirror `CreativePartners.tsx` |
| **Acceptance** | Lighthouse Accessibility: audit "ARIA required children" passes for filter |
| **Tests** | axe / Lighthouse A11y; keyboard: Arrow keys between tabs (optional) |

### 1.3 — Footer social accessible names

| Item | Detail |
|------|--------|
| **Problem** | Icon fallback "Be" + span "Facebook" → "Be Facebook" |
| **Files** | `components/Footer.tsx` |
| **Fix** | `aria-label={link.name}` on `<a>`, `aria-hidden="true"` on decorative icon/text |
| **Acceptance** | Lighthouse: "Identical links" / accessible name audits pass for footer social |
| **Tests** | Screen reader or DevTools Accessibility tree: name = "Facebook", "Behance", etc. |

### 1.4 — SeoInternalLinks contrast

| Item | Detail |
|------|--------|
| **Problem** | `text-primary-soft` (#FF9A7A) on white fails contrast |
| **Files** | `components/SeoInternalLinks.tsx`, optionally `tailwind.config.ts` |
| **Fix** | Use `text-primary` or `text-foreground/80` for links on white background |
| **Acceptance** | Lighthouse Contrast audit: no failures for SeoInternalLinks block |
| **Tests** | Lighthouse A11y; WebAIM contrast checker on link color |

### 1.5 — `llms.txt` Agentic audit

| Item | Detail |
|------|--------|
| **Problem** | "File does not appear to contain any links" (Lighthouse wants markdown links) |
| **Files** | `public/llms.txt` |
| **Fix** | Use markdown link syntax `[Label](https://...)` under H1; keep plain URLs as backup |
| **Acceptance** | Lighthouse Agentic: llms.txt audit passes |
| **Tests** | `curl https://liobiz.com/llms.txt`; re-run Lighthouse Agentic |

### 1.6 — Video captions (Creative Partners)

| Item | Detail |
|------|--------|
| **Problem** | `<video>` without `<track kind="captions">` |
| **Files** | `components/CreativePartners.tsx`, `components/CmsMedia.tsx` |
| **Fix** | Add empty/descriptive `track` with `kind="captions"` `srclang="fa"` or `aria-describedby` + hide decorative autoplay from a11y tree if no audio |
| **Acceptance** | Lighthouse: video captions audit passes or marked N/A with muted decorative video |
| **Tests** | Lighthouse A11y |

### Phase 1 verification checklist
```powershell
pnpm build
pnpm lint   # if configured
# Lighthouse CLI (local prod):
pnpm build && pnpm start   # port 3000
npx lighthouse http://localhost:3000 --only-categories=accessibility,best-practices --chrome-flags="--headless"
# Production (after deploy):
npx lighthouse https://liobiz.com --preset=desktop --only-categories=accessibility,best-practices,seo
npx lighthouse https://liobiz.com --preset=mobile  --only-categories=accessibility,best-practices,seo
```

**Phase 1 DONE when:**
- [ ] Accessibility ≥ 95 both modes
- [ ] Best Practices ≥ 95 both modes
- [ ] No `/api/auth/me` 401 when logged out
- [ ] Agentic llms.txt passes (or documented exception)

---

## Phase 2 — React hydration (#418) + CMS stability

### Goal
Eliminate `Minified React error #418` (text hydration mismatch).

### Root causes (investigate in order)
1. `CmsEditProvider` client fetch changes content after SSR
2. `EditableText` / `CmsRichTextField` HTML vs plain text branch
3. `LoadingScreen` + `sessionStorage` visibility mismatch
4. `Footer` `new Date().getFullYear()` (minor)
5. `useHomeLanding` resolution order vs SSR props

### Actions
| Step | File | Action |
|------|------|--------|
| 2.1 | `CmsEditProvider.tsx` | Use SSR `initialContent` only for first paint; defer CMS refetch to admin edit mode |
| 2.2 | `LoadingScreen.tsx` | Default hidden on SSR (`useState(false)`), show only after client check; or `suppressHydrationWarning` |
| 2.3 | `Footer.tsx` | `<span suppressHydrationWarning>{year}</span>` or static year from server |
| 2.4 | `CmsRichTextField.tsx` | Ensure server and client both use same sanitized HTML path |
| 2.5 | Dev-only | Run `pnpm dev`, reproduce #418 in console, fix last offender |

### Acceptance criteria
- [ ] Chrome DevTools Console: zero React #418 on homepage load (logged out, 3 reloads)
- [ ] Lighthouse Best Practices: "Browser errors were logged" — no React errors

### Tests
```powershell
# Playwright or manual: hard reload x3
# Lighthouse best-practices category
npx lighthouse https://liobiz.com --only-categories=best-practices
```

---

## Phase 3 — Performance: third-party scripts

### Goal
Reduce TBT and main-thread work from analytics.

| Script | Size | Current | Target |
|--------|------|---------|--------|
| ContentSquare | ~151 KiB | lazyOnload + idle | After first interaction OR `NEXT_PUBLIC_ENABLE_CS=1` only |
| GTM | ~110 KiB | lazyOnload + idle | Same gate; consider single tag manager |
| Facebook Pixel | varies | DeferredAnalytics | Env-gated `NEXT_PUBLIC_FB_PIXEL_ID` |
| Cloudflare beacon | ~11 KiB | auto-injected | Cannot remove (hosting); ignore in score |

### Files
- `components/DeferredAnalytics.tsx`
- `components/ContentsquareAnalytics.tsx`
- `components/GoogleTagManager.tsx`
- `components/FacebookPixel.tsx`
- `.env.example` — document flags

### Acceptance criteria
- [ ] Lighthouse Desktop TBT reduced by ≥ 500ms vs baseline (2390ms → target <1800ms)
- [ ] Network: ContentSquare/GTM not loaded before `load` event or first scroll
- [ ] Functional: GTM/CS still fire after interaction when enabled in `.env.local`

### Tests
- Lighthouse Performance (Desktop + Mobile)
- Manual: scroll/click → verify GTM in Tag Assistant (optional)

---

## Phase 4 — Performance: LCP & Hero

### Goal
Fix LCP element render delay (8630ms desktop reported).

| Issue | File | Fix |
|-------|------|-----|
| LoadingScreen blocks hero | `LoadingScreen.tsx`, `app/page.tsx` | Remove from critical path or max 0ms repeat visitors |
| Hero video/image late | `components/hero/Hero.tsx` | `priority` Image; poster; `preload="metadata"` only; consider static poster LCP |
| SmoothScroll delays paint | `SmoothScroll.tsx` | Init after `window.load` + `requestIdleCallback`; desktop-only (existing) |
| Framer delay on h1 | `Hero.tsx` | Remove initial opacity animation on LCP text or use CSS only |
| Missing preload | `app/layout.tsx` or `page.tsx` | `<link rel="preload" as="image" href="hero-poster">` |

### Acceptance criteria
- [ ] Desktop LCP ≤ 2.5s (lab, throttled)
- [ ] Mobile LCP ≤ 4.0s (lab, Slow 4G)
- [ ] Lighthouse "LCP element render delay" < 1000ms

### Tests
```powershell
npx lighthouse https://liobiz.com --preset=desktop --only-categories=performance
npx lighthouse https://liobiz.com --preset=mobile  --only-categories=performance
```

---

## Phase 5 — Performance: JS weight & network payload

### Goal
Cut unused JS and enormous payloads.

| Issue | Fix |
|-------|-----|
| `/api/content` ~40 KiB duplicate | Extend `HomeDataProvider`; remove client fetch from Header, Footer, ThemeProvider, LoadingScreen on `/` |
| chunk `8409` unused 62 KiB | Dynamic import CMS edit bundle only for admins |
| chunk `3547` (GSAP) | Already lazy; verify not in initial homepage bundle |
| 2× MP4 ~1.1MB each | `preload="none"`; load on tab visible / IntersectionObserver |
| logo.png 135 KiB | Convert to WebP/SVG in `public/` |
| Legacy polyfills 12 KiB | `browserslist` modern only (optional) |

### Files
- `components/HomeDataProvider.tsx`, `app/page.tsx`
- `components/Header.tsx`, `Footer.tsx`, `ThemeProvider.tsx`
- `components/CreativePartners.tsx`
- `next.config.ts`

### Acceptance criteria
- [ ] Homepage network payload −500 KiB+ (lab)
- [ ] "Reduce unused JavaScript" savings ≤ 150 KiB (from ~270)
- [ ] Performance score Desktop ≥ 65, Mobile ≥ 55 (intermediate target)

---

## Phase 6 — CSP & security headers (Best Practices polish)

| Issue | File | Fix |
|-------|------|-----|
| Cloudflare email-decode blocked | `lib/security-headers.ts` | Add `'self'` path for `/cdn-cgi/scripts/` OR disable email obfuscation in CF dashboard |
| HSTS preload | nginx / `security-headers.ts` | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| COOP | `security-headers.ts` | `Cross-Origin-Opener-Policy: same-origin` (test embeds) |

**Note:** Trusted Types is optional; high effort, low Lighthouse score impact.

---

## Phase 7 — CSS & misc polish

- Render-blocking CSS: consider critical CSS inline for above-fold (optional)
- `soft-pulse-glow` box-shadow animation → `transform` + opacity only
- Responsive images: portfolio thumbs sizes attribute
- `btn-primary` contrast fix in `globals.css`

---

## Testing reference

### Local commands
```powershell
cd d:\liobiz\liobiz
pnpm install
pnpm build          # must pass
pnpm start          # production mode local (needs data/)
pnpm dev            # hydration debugging
```

### Lighthouse CLI
```powershell
npm i -g lighthouse   # once
lighthouse https://liobiz.com --output html --output-path ./reports/lh-desktop.html --preset=desktop --view
lighthouse https://liobiz.com --output html --output-path ./reports/lh-mobile.html  --preset=mobile  --view
```

### PageSpeed Insights API (monitoring only)
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url=https://liobiz.com
  &strategy=mobile|desktop
  &category=performance&category=accessibility&category=best-practices&category=seo
  &key=YOUR_KEY
```
Store API key in `.env.local` as `PAGESPEED_API_KEY` — **never commit**.

### Deploy (safe patch)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\apply-seo-patch-safe.ps1
# Or single file:
scp app/layout.tsx liobiz:/var/www/liobiz/app/
ssh liobiz "cd /var/www/liobiz && pnpm build && systemctl restart liobiz"
```

### Post-deploy smoke
```powershell
curl -s -o NUL -w "%{http_code}" https://liobiz.com/
ssh liobiz "systemctl is-active liobiz && cat /var/www/liobiz/.next/BUILD_ID"
```

---

## Progress tracker

| Phase | Status | Desktop Perf | Mobile Perf | A11y | BP | Verified date |
|-------|--------|--------------|-------------|------|----|----|
| 0 Sync | ✅ | — | — | — | — | 2026-08-07 |
| 1 Quick wins | ✅ | — | — | 97 | 100 | 2026-08-07 |
| 2 Hydration + CSP | ✅ | — | — | — | 100 | 2026-08-07 |
| 2.5 UX layout | ✅ | — | — | — | — | 2026-08-07 |
| 3 Third-party | 🟡 | 97 | 97 | — | 100 | 2026-08-07 |
| 4 LCP/Hero | 🟡 | 97 | 97 | — | — | 2026-08-07 |
| 5 JS/payload | 🟡 | 97 | 97 | — | — | 2026-08-07 |
| 6 CSP/headers | ⬜ | — | — | — | 100 | optional |
| 7 Polish | 🟡 | — | — | target 100 | — | 2026-08-07 |

Update this table after each phase verification.

---

## File index (quick reference)

```
app/layout.tsx              — analytics mount, metadata
app/page.tsx                — HomeDataProvider, SmoothScroll, LoadingScreen, Hero order
components/DeferredAnalytics.tsx
components/Portfolio.tsx    — tablist ARIA
components/Footer.tsx       — social a11y, /api/content fetch
components/SeoInternalLinks.tsx — contrast
components/CreativePartners.tsx — video preload/captions
components/cms-edit/CmsEditProvider.tsx — auth/me, content fetch
components/LoadingScreen.tsx — LCP blocker, hydration
components/hero/Hero.tsx    — LCP element
public/llms.txt             — Agentic browsing
lib/security-headers.ts     — CSP
scripts/apply-seo-patch-safe.ps1 — deploy
```

---

## Notes

- **SEO 100** — maintain; do not regress hreflang, canonical, keywords (single tag).
- **401 on auth/me** — not a security issue; UX/console noise only.
- **Sync before every phase** if server hotfixes were applied outside git.
- **One phase at a time** — user requirement: complete verification before next phase.
