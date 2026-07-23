import type { LucideIcon } from "lucide-react";
import DashIcon from "@/components/dashboard/DashIcon";

type DashQuickCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
};

export default function DashQuickCard({ icon, title, description, onClick }: DashQuickCardProps) {
  return (
    <button type="button" className="dash-quick-card" onClick={onClick}>
      <span className="dash-quick-card-icon">
        <DashIcon icon={icon} variant="indigo" />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}
