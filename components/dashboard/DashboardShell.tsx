"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";

export type DashNavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
};

function SidebarPanel({
  title,
  subtitle,
  homeHref,
  onLogout,
  nav,
  active,
  onNavigate,
  onClose,
  className,
}: {
  title: string;
  subtitle: string;
  homeHref: string;
  onLogout: () => void;
  nav: DashNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
  className: string;
}) {
  return (
    <aside className={className}>
      <div className="dash-sidebar-brand">
        <div className="dash-sidebar-logo">
          <Logo width={120} />
        </div>
        <div className="dash-sidebar-copy">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <nav className="dash-nav" aria-label="منوی داشبورد">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`dash-nav-${item.id}`}
              className={active === item.id ? "is-active" : ""}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            >
              {Icon ? (
                <span className="dash-nav-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.85} />
                </span>
              ) : null}
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="dash-nav-badge" aria-label={`${item.badge} مورد جدید`}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="dash-sidebar-actions">
        <Link href={homeHref} className="btn-outline w-full justify-center">
          مشاهده سایت
        </Link>
        <button type="button" className="btn-primary w-full justify-center" onClick={onLogout}>
          خروج
        </button>
      </div>
    </aside>
  );
}

export default function DashboardShell({
  title,
  subtitle,
  nav,
  active,
  onNavigate,
  children,
  homeHref = "/",
  variant = "client",
}: {
  title: string;
  subtitle: string;
  nav: DashNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  homeHref?: string;
  variant?: "admin" | "client";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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

  const closeDrawer = () => setOpen(false);

  const mobileDrawer =
    open && portalReady
      ? createPortal(
          <>
            <button
              type="button"
              className="dash-mobile-drawer-backdrop"
              aria-label="بستن منو"
              onClick={closeDrawer}
            />
            <SidebarPanel
              title={title}
              subtitle={subtitle}
              homeHref={homeHref}
              onLogout={logout}
              nav={nav}
              active={active}
              onNavigate={onNavigate}
              onClose={closeDrawer}
              className="dash-mobile-drawer-sidebar is-open"
            />
          </>,
          document.body,
        )
      : null;

  return (
    <div className={`dash-page dash-page--${variant}`}>
      <div className="dash-topbar">
        <div className="dash-topbar-logo min-w-0">
          <Logo height={40} />
        </div>
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

      {mobileDrawer}

      <div className="dash-shell">
        <SidebarPanel
          title={title}
          subtitle={subtitle}
          homeHref={homeHref}
          onLogout={logout}
          nav={nav}
          active={active}
          onNavigate={onNavigate}
          onClose={closeDrawer}
          className="dash-sidebar dash-sidebar--desktop"
        />

        <div className="dash-main">{children}</div>
      </div>
    </div>
  );
}
