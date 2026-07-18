"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  ShieldCheck,
  Clock3,
  Heart,
  type LucideIcon,
} from "lucide-react";
import CmsMedia from "@/components/CmsMedia";
import { aspectRatioClass, resolveMediaKind } from "@/lib/media-types";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { BACKSTAGE_GALLERY } from "@/lib/constants";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import CmsRichText from "@/components/CmsRichText";
import { defaultTeamStats, type TeamStatItem } from "@/lib/landing-defaults";
import type { BackstageItem } from "@/lib/content-store";

const iconMap: Record<string, LucideIcon> = {
  headphones: Headphones,
  shield: ShieldCheck,
  clock: Clock3,
  heart: Heart,
};

const GAP_PX = 14; // keep in sync with CSS gap (0.85rem ≈ 13.6px)

function normalizeGallery(items: BackstageItem[]): BackstageItem[] {
  const usable = items.filter((item) => {
    if (!item?.image && !item?.videoSrc) return false;
    if (resolveMediaKind(item) === "video" && item.videoSrc?.trim()) return true;
    return Boolean(item.image && !String(item.image).endsWith(".svg"));
  });
  return usable.length ? usable : items.filter((item) => item?.image || item?.videoSrc);
}

function padGallery(items: BackstageItem[], minCount = 12): BackstageItem[] {
  if (!items.length) return [];
  const out: BackstageItem[] = [];
  let i = 0;
  while (out.length < Math.max(minCount, items.length)) {
    const src = items[i % items.length];
    out.push({
      ...src,
      id: Number(`${Math.abs(Number(src.id) || 1)}${String(out.length).padStart(3, "0")}`),
    });
    i += 1;
  }
  return out;
}

function MarqueeRow({
  items,
  reverse = false,
  speed = 42,
  reduced,
}: {
  items: BackstageItem[];
  reverse?: boolean;
  speed?: number;
  reduced: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const groupARef = useRef<HTMLDivElement>(null);
  const groupBRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const loopRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const groupA = groupARef.current;
    const groupB = groupBRef.current;
    if (!track || !groupA || !groupB) return;

    if (reduced) {
      track.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    let raf = 0;
    let last = performance.now();
    let booted = false;

    const apply = () => {
      track.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
    };

    const wrap = (x: number, w: number) => {
      if (w <= 0) return x;
      // Keep x in (-w, 0]
      let next = x % w;
      if (next > 0) next -= w;
      if (next <= -w) next += w;
      return next;
    };

    const measure = () => {
      // Distance from start of A to start of B = one seamless loop (includes row gap)
      const byOffset = groupB.offsetLeft - groupA.offsetLeft;
      const fallback = groupA.offsetWidth + GAP_PX;
      const w = byOffset > 1 ? byOffset : fallback;
      if (w <= 1) return;

      const prev = loopRef.current;
      loopRef.current = w;

      if (!booted) {
        xRef.current = reverse ? -w * 0.5 : 0;
        booted = true;
      } else if (prev > 1 && Math.abs(prev - w) > 0.5) {
        xRef.current = (xRef.current / prev) * w;
        xRef.current = wrap(xRef.current, w);
      }
      apply();
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(groupA);
    ro.observe(groupB);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = loopRef.current;

      if (!pausedRef.current && w > 1) {
        const delta = speed * dt;
        xRef.current += reverse ? delta : -delta;
        xRef.current = wrap(xRef.current, w);
        apply();
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [items, reduced, reverse, speed]);

  const renderGroup = (
    key: string,
    ref: RefObject<HTMLDivElement | null>,
    hidden?: boolean,
  ) => (
    <div
      ref={ref}
      className="backstage-marquee-group"
      aria-hidden={hidden || undefined}
    >
      {items.map((item, index) => (
        <article key={`${key}-${item.id}-${index}`} className="backstage-slide">
          <div
            className={`backstage-slide-frame ${aspectRatioClass(item.aspectRatio ?? "portrait")}`}
          >
            <CmsMedia
              image={item.image}
              videoSrc={item.videoSrc}
              mediaKind={item.mediaKind}
              aspectRatio={item.aspectRatio}
              alt={item.caption}
              fill
              fitParent
              sizes="(max-width: 768px) 55vw, 280px"
              priority={index < 4}
            />
            <div className="backstage-slide-overlay" />
            <div className="backstage-slide-meta">
              <span>{item.caption}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div
      className="backstage-marquee-track is-ready"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div ref={trackRef} className="backstage-marquee-row is-js">
        {renderGroup("a", groupARef)}
        {renderGroup("b", groupBRef, true)}
      </div>
    </div>
  );
}

export default function Backstage() {
  const reduced = usePrefersReducedMotion();
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);
  const [teamStats, setTeamStats] = useState<TeamStatItem[]>(defaultTeamStats);
  // Seed immediately so marquee paints without waiting for /api/content
  const [gallery, setGallery] = useState<BackstageItem[]>(() =>
    normalizeGallery(BACKSTAGE_GALLERY as BackstageItem[]),
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.teamStats)) setTeamStats(data.teamStats);
        const items = Array.isArray(data.backstage) ? data.backstage : [];
        const next = normalizeGallery(items);
        if (next.length) setGallery(next);
      })
      .catch(() => {
        /* keep seeded gallery */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rowA = useMemo(() => padGallery(gallery, 12), [gallery]);
  const rowB = useMemo(() => padGallery([...gallery].reverse(), 12), [gallery]);

  return (
    <section id="backstage" className="backstage-section section-block">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="section-label">{landing.backstageLabel}</span>
          <h2 className="section-title">{landing.backstageTitle}</h2>
          <CmsRichText content={landing.backstageIntro} className="mx-auto mt-4 max-w-2xl" />
        </motion.div>
      </div>

      {rowA.length > 0 && (
        <div className="backstage-marquee-full" dir="ltr" aria-label="گالری پشت صحنه">
          <MarqueeRow items={rowA} speed={46} reduced={reduced} />
          <MarqueeRow items={rowB} reverse speed={40} reduced={reduced} />
        </div>
      )}

      <div className="container mx-auto">
        <div className="team-stats">
          {teamStats.map((stat) => {
            const Icon = iconMap[stat.icon] ?? Headphones;
            return (
              <div key={stat.label} className="team-stat">
                <div className="team-stat-icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
