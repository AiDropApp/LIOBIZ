import type { LucideIcon } from "lucide-react";

type DashIconProps = {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  variant?: "gold" | "indigo";
};

export default function DashIcon({
  icon: Icon,
  size = 18,
  strokeWidth = 1.65,
  variant = "gold",
}: DashIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={variant === "indigo" ? "dash-icon-indigo" : "dash-icon-gold"}
      aria-hidden
    />
  );
}
