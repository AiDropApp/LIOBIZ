"use client";

import { useId, useMemo } from "react";

type DashSparklineProps = {
  seed: string;
  value: number;
  width?: number;
  height?: number;
  className?: string;
};

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildPoints(seed: string, value: number, width: number, height: number, count = 9) {
  let hash = hashSeed(seed);
  const pad = 2;
  const innerH = height - pad * 2;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const noise = (hash % 1000) / 1000;
    const trend = i / (count - 1);
    const lift = Math.min(value / Math.max(value + 12, 1), 1) * 0.22;
    const normalized = 0.28 + noise * 0.38 + trend * (0.22 + lift);
    const x = pad + (i / (count - 1)) * (width - pad * 2);
    const y = pad + (1 - normalized) * innerH;
    points.push({ x, y });
  }

  return points;
}

export default function DashSparkline({
  seed,
  value,
  width = 104,
  height = 34,
  className = "",
}: DashSparklineProps) {
  const uid = useId().replace(/:/g, "");
  const lineId = `dash-spark-line-${uid}`;
  const fillId = `dash-spark-fill-${uid}`;

  const { linePath, areaPath } = useMemo(() => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const pts = buildPoints(seed, safeValue, width, height);
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const area = `${line} L ${(width - 2).toFixed(2)} ${(height - 2).toFixed(2)} L 2 ${(height - 2).toFixed(2)} Z`;
    return { linePath: line, areaPath: area };
  }, [seed, value, width, height]);

  return (
    <svg
      className={`dash-sparkline ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <linearGradient id={lineId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.45)" />
          <stop offset="55%" stopColor="rgba(129, 140, 248, 0.85)" />
          <stop offset="100%" stopColor="rgba(201, 169, 98, 0.95)" />
        </linearGradient>
        <linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.22)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </linearGradient>
      </defs>
      <path className="dash-sparkline-area" d={areaPath} fill={`url(#${fillId})`} />
      <path
        className="dash-sparkline-line"
        d={linePath}
        fill="none"
        stroke={`url(#${lineId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
