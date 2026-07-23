"use client";

import type { LucideIcon } from "lucide-react";
import CountUp from "@/components/dashboard/CountUp";
import DashIcon from "@/components/dashboard/DashIcon";
import DashSparkline from "@/components/dashboard/DashSparkline";

type DashStatCardProps = {
  icon: LucideIcon;
  label: string;
  seed: string;
  value: number | null | undefined;
  onClick?: () => void;
};

export default function DashStatCard({ icon, label, seed, value, onClick }: DashStatCardProps) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;
  const sparkValue = numeric ?? 0;

  const body = (
    <>
      <div className="dash-stat-card-head">
        <span className="dash-stat-label">{label}</span>
        <span className="dash-stat-icon">
          <DashIcon icon={icon} size={16} />
        </span>
      </div>
      {numeric === null ? (
        <strong className="dash-stat-value">—</strong>
      ) : (
        <CountUp value={numeric} className="dash-stat-value" />
      )}
      <DashSparkline seed={seed} value={sparkValue} width={120} height={26} className="dash-stat-spark" />
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="dash-stat-card" onClick={onClick}>
        {body}
      </button>
    );
  }

  return <article className="dash-stat-card">{body}</article>;
}
