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
import { aspectRatioClass } from "@/lib/media-types";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor from "@/components/cms-edit/CmsCardEditor";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import { defaultTeamStats, type TeamStatItem } from "@/lib/landing-defaults";
import type { BackstageItem } from "@/lib/content-store";

const iconMap: Record<string, LucideIcon> = {
  headphones: Headphones,
  shield: ShieldCheck,
  clock: Clock3,
  heart: Heart,
};

const GAP_PX = 14; // keep in sync with CSS gap (0.85rem ≈ 13.6px)

function hasSlideMedia(item: BackstageItem): boolean {
  if (item.videoSrc?.trim()) return true;
  return Boolean(item.image?.trim() && !String(item.image).endsWith(".svg"));
}

function MarqueeRow({
  items,
  allItems,
  reverse = false,
  speed = 42,
  reduced,
  edit = false,
}: {
  items: BackstageItem[];
  allItems: BackstageItem[];
  reverse?: boolean;
  speed?: number;
  reduced: boolean;
  edit?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupARef = useRef<HTMLDivElement>(null);
  const groupBRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const loopRef = useRef(0);
  const pausedRef = useRef(false);
  const [seamlessLoop, setSeamlessLoop] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const groupA = groupARef.current;
    if (!container || !groupA) return;

    const measureLoop = () => {
      const containerW = container.clientWidth;
      const groupW = groupA.scrollWidth;
      setSeamlessLoop(groupW > containerW + GAP_PX);
    };

    measureLoop();
    const ro = new ResizeObserver(measureLoop);
    ro.observe(container);
    ro.observe(groupA);
    return () => ro.disconnect();
  }, [items]);

  useEffect(() => {
    const track = trackRef.current;
    const groupA = groupARef.current;
    const groupB = groupBRef.current;
    if (!track || !groupA) return;
    if (seamlessLoop && !groupB) return;

    if (reduced || !seamlessLoop || edit) {
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
      if (!groupB) return;
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
    if (groupB) ro.observe(groupB);

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
  }, [items, reduced, reverse, seamlessLoop, speed, edit]);

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
      {items.map((item, index) => {
        const showMedia = hasSlideMedia(item);
        const globalIndex = allItems.findIndex((g) => g.id === item.id);
        const slide = (
          <article className="backstage-slide">
            <div
              className={`backstage-slide-frame ${aspectRatioClass(item.aspectRatio ?? "portrait")}${showMedia || edit ? "" : " backstage-slide-frame--empty"}`}
            >
              {showMedia ? (
                <CmsMedia
                  image={item.image}
                  videoSrc={item.videoSrc}
                  mediaKind={item.mediaKind}
                  aspectRatio={item.aspectRatio}
                  alt={item.caption}
                  fill
                  fitParent
                  sizes="(max-width: 768px) 55vw, 280px"
                />
              ) : (
                <div className="backstage-slide-empty" aria-hidden />
              )}
              <div className="backstage-slide-overlay" />
              <div className="backstage-slide-meta">
                <span>{item.caption}</span>
              </div>
            </div>
          </article>
        );

        if (edit && globalIndex >= 0) {
          return (
            <CmsCardEditor
              key={`${key}-${item.id}-${index}`}
              title={item.caption}
              fields={[
                {
                  type: "image",
                  path: `backstage.${globalIndex}.image`,
                  label: "تصویر",
                  src: item.image,
                  uploadKind: "backstage",
                },
                {
                  type: "text",
                  path: `backstage.${globalIndex}.videoSrc`,
                  label: "ویدیو (URL)",
                  dir: "ltr",
                },
                {
                  type: "richtext",
                  path: `backstage.${globalIndex}.caption`,
                  label: "عنوان",
                },
              ]}
            >
              {slide}
            </CmsCardEditor>
          );
        }

        return <div key={`${key}-${item.id}-${index}`}>{slide}</div>;
      })}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`backstage-marquee-track is-ready${seamlessLoop && !edit ? "" : " is-static"}`}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        ref={trackRef}
        className={`backstage-marquee-row is-js${seamlessLoop && !edit ? "" : " is-static"}`}
      >
        {renderGroup("a", groupARef)}
        {seamlessLoop && renderGroup("b", groupBRef, true)}
      </div>
    </div>
  );
}

export default function Backstage({
  initialLanding,
  initialGallery,
  initialTeamStats,
}: {
  initialLanding?: LandingContent;
  initialGallery?: BackstageItem[];
  initialTeamStats?: TeamStatItem[];
} = {}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const reduced = usePrefersReducedMotion();
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const [teamStats, setTeamStats] = useState<TeamStatItem[]>(
    home?.teamStats ?? initialTeamStats ?? defaultTeamStats,
  );
  const [gallery, setGallery] = useState<BackstageItem[]>(home?.backstage ?? initialGallery ?? []);

  useEffect(() => {
    if ((home?.backstage || initialGallery) && (home?.teamStats || initialTeamStats)) return;
    let cancelled = false;
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.teamStats)) setTeamStats(data.teamStats);
        if (Array.isArray(data.backstage)) setGallery(data.backstage);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [home?.backstage, home?.teamStats, initialGallery, initialTeamStats]);

  const rowA = useMemo(() => gallery.slice(0, 10), [gallery]);
  const rowB = useMemo(() => gallery.slice(10, 20), [gallery]);

  return (
    <section id="backstage" className="backstage-section section-block">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <LandingSectionHeader
            labelPath="landing.backstageLabel"
            titlePath="landing.backstageTitle"
            introPath="landing.backstageIntro"
            label={landing.backstageLabel}
            title={landing.backstageTitle}
            intro={landing.backstageIntro}
            className="mb-10 text-center"
          />
        </motion.div>
      </div>

      {rowA.length > 0 && (
        <div className="backstage-marquee-full" dir="ltr" aria-label="گالری پشت صحنه">
          <MarqueeRow items={rowA} allItems={gallery} speed={46} reduced={reduced} edit={edit} />
          {rowB.length > 0 && (
            <MarqueeRow items={[...rowB].reverse()} allItems={gallery} reverse speed={40} reduced={reduced} edit={edit} />
          )}
        </div>
      )}

      <div className="container mx-auto">
        <div className="team-stats">
          {teamStats.map((stat, index) => {
            const Icon = iconMap[stat.icon] ?? Headphones;
            return (
              <div key={stat.label} className="team-stat cms-editable-card">
                <div className="team-stat-icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <EditableText path={`teamStats.${index}.value`} as="span" className="font-bold block">
                  {stat.value}
                </EditableText>
                <EditableText path={`teamStats.${index}.label`} as="span">
                  {stat.label}
                </EditableText>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
