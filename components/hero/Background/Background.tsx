"use client";

import GradientLayer from "./GradientLayer";
import AmbientGlow from "./AmbientGlow";
import NoiseOverlay from "./NoiseOverlay";

export default function Background({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ opacity }}
      aria-hidden="true"
    >
      <GradientLayer />
      <AmbientGlow />
      <NoiseOverlay />
    </div>
  );
}
