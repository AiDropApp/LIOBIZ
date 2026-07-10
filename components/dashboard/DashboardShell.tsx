"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";

export type DashNavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

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
  nav: DashNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  homeHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const NavButtons = () => (
    <>
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? "is-active" : ""}
            onClick={() => {
              onNavigate(item.id);
              setOpen(false);
            }}
          >
            {Icon ? (
              <span className="dash-nav-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.85} />
              </span>
            ) : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );

  return (
    <div className="dash-page">
      <div className="dash-topbar lg:hidden">
        <Logo height={40} />
        <div className="dash-topbar-copy">
          <strong>{title}</strong>
        </div>
        <button
          type="button"
          className="dash-menu-btn"
          aria-label={open ? "بستن منو" : "باز کردن منو"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <button
          type="button"
          className="dash-drawer-backdrop lg:hidden"
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="dash-shell">
        <aside className={`dash-sidebar lux-card ${open ? "is-open" : ""}`}>
          <div className="dash-sidebar-brand hidden lg:block">
            <Logo width={120} />
            <div className="dash-sidebar-copy">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="dash-sidebar-brand lg:hidden">
            <div className="dash-sidebar-copy">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <nav className="dash-nav" aria-label="منوی داشبورد">
            <NavButtons />
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
