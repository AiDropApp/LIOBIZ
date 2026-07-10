"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

type Planet = {
  id: string;
  /** orbit diameter % */
  orbit: number;
  size: number;
  color: string;
  glow: string;
  startAngle: number;
  /** seconds for one full revolution — slower = farther feel */
  duration: number;
  label?: string;
  subtitle?: string;
  ring?: boolean;
};

/** One planet per orbit — never share a ring, so paths never collide */
const planets: Planet[] = [
  {
    id: "mercury",
    orbit: 42,
    size: 11,
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.55)",
    startAngle: -40,
    duration: 38,
  },
  {
    id: "venus",
    orbit: 52,
    size: 13,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
    startAngle: 110,
    duration: 48,
  },
  {
    id: "branding",
    orbit: 62,
    size: 17,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.55)",
    startAngle: -85,
    duration: 58,
    label: "Branding",
    subtitle: "برندینگ",
    ring: true,
  },
  {
    id: "ai",
    orbit: 72,
    size: 15,
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.6)",
    startAngle: 35,
    duration: 68,
    label: "AI",
    subtitle: "هوش مصنوعی",
  },
  {
    id: "website",
    orbit: 82,
    size: 15,
    color: "#34d399",
    glow: "rgba(52,211,153,0.5)",
    startAngle: 175,
    duration: 80,
    label: "Website",
    subtitle: "وب‌سایت",
  },
  {
    id: "ads",
    orbit: 92,
    size: 16,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.55)",
    startAngle: 250,
    duration: 94,
    label: "Ads",
    subtitle: "تبلیغات",
  },
  {
    id: "social",
    orbit: 102,
    size: 18,
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.55)",
    startAngle: 300,
    duration: 110,
    label: "Social",
    subtitle: "شبکه‌های اجتماعی",
    ring: true,
  },
];

export default function HeroArtwork() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.4 });
  const rotateY = useTransform(sx, [-1, 1], [-4, 4]);
  const rotateX = useTransform(sy, [-1, 1], [3.5, -3.5]);
  const shiftX = useTransform(sx, [-1, 1], [-6, 6]);
  const shiftY = useTransform(sy, [-1, 1], [-4, 4]);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reduced || !rootRef.current) return;
      if (event.pointerType === "touch") return;
      const rect = rootRef.current.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      mx.set(Math.max(-1, Math.min(1, nx)));
      my.set(Math.max(-1, Math.min(1, ny)));
    },
    [mx, my, reduced],
  );

  const onPointerLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
    setHovered(null);
  }, [mx, my]);

  return (
    <div
      ref={rootRef}
      className="hero-artwork relative mx-auto aspect-square w-full max-w-[540px] lg:max-w-[580px] lg:translate-y-[-2%]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        className="hero-system absolute inset-0"
        style={
          reduced
            ? undefined
            : { rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 900 }
        }
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[66%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14),transparent_64%)] blur-2xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12),transparent_70%)] blur-xl" />

        {planets.map((planet, index) => (
          <div
            key={`ring-${planet.id}`}
            className={`hero-orbit-ring pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              index % 2 === 0 ? "is-dashed" : "is-solid"
            }`}
            style={{ width: `${planet.orbit}%`, height: `${planet.orbit}%` }}
          />
        ))}

        <div className="hero-orb absolute left-1/2 top-1/2 z-[2] h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2">
          <div className={`hero-orb-core absolute inset-[10%] rounded-full ${reduced ? "" : "is-breathing"}`} />
          <div className="hero-orb-ring absolute inset-0 rounded-full" />
          <div className="hero-orb-shine absolute left-[18%] top-[16%] h-[24%] w-[30%] rounded-full" />
        </div>

        {planets.map((planet) => {
          const isLit = hovered === planet.id;
          return (
            <div
              key={planet.id}
              className={`hero-planet-orbit ${reduced ? "is-static" : ""}`}
              style={{
                width: `${planet.orbit}%`,
                height: `${planet.orbit}%`,
                marginLeft: `${-planet.orbit / 2}%`,
                marginTop: `${-planet.orbit / 2}%`,
                ["--orbit-duration" as string]: `${planet.duration}s`,
                ["--start-angle" as string]: `${planet.startAngle}deg`,
              }}
            >
              <div className="hero-planet-slot">
                <div className="hero-planet-face">
                  <button
                    type="button"
                    className={`hero-planet ${planet.ring ? "has-ring" : ""} ${isLit ? "is-lit" : ""}`}
                    style={{
                      width: planet.size,
                      height: planet.size,
                      background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 34%), radial-gradient(circle at 50% 50%, ${planet.color}, color-mix(in srgb, ${planet.color} 52%, #0b1220))`,
                      boxShadow: `0 0 16px ${planet.glow}, inset 0 0 10px rgba(255,255,255,0.18)`,
                    }}
                    aria-label={planet.label ? `${planet.label} ${planet.subtitle ?? ""}` : "سیاره"}
                    onMouseEnter={() => setHovered(planet.id)}
                    onMouseLeave={() => setHovered((v) => (v === planet.id ? null : v))}
                    onFocus={() => setHovered(planet.id)}
                    onBlur={() => setHovered((v) => (v === planet.id ? null : v))}
                  >
                    {planet.ring && <span className="hero-planet-ring" aria-hidden="true" />}
                  </button>

                  {planet.label && (
                    <div className={`hero-planet-label ${isLit ? "is-visible" : ""}`}>
                      <strong>{planet.label}</strong>
                      {planet.subtitle && <span>{planet.subtitle}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
