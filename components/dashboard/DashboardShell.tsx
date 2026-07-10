"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type NavItem = { id: string; label: string };

export default function DashboardShell({
  title,
  subtitle,
  nav,
  active,
  onNavigate,
  children,
  homeHref = "/",
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  homeHref?: string;
}) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <aside className="dash-sidebar lux-card">
          <Logo width={120} />
          <div className="dash-sidebar-copy">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <nav className="dash-nav">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={active === item.id ? "is-active" : ""}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="dash-sidebar-actions">
            <Link href={homeHref} className="btn-outline w-full justify-center">
              مشاهده سایت
            </Link>
            <button type="button" className="btn-primary w-full justify-center" onClick={logout}>
              خروج
            </button>
          </div>
        </aside>

        <div className="dash-main">{children}</div>
      </div>
    </div>
  );
}
