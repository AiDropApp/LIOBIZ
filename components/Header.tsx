"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS, SERVICES } from "@/lib/constants";
import Logo from "./Logo";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!servicesOpen) return;
    const onScrollClose = () => setServicesOpen(false);
    window.addEventListener("scroll", onScrollClose, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScrollClose);
  }, [servicesOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!servicesRef.current?.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setServicesOpen(false);
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/" && href.includes("services");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const servicesActive = pathname.startsWith("/services");

  const fade = (delay: number) =>
    reducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: "easeOut", delay },
        };

  return (
    <header className={`lux-header ${scrolled ? "is-scrolled" : ""}`}>
      <motion.div
        className="lux-header-shell"
        initial={reducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="header-bar">
          <motion.div className="header-brand" {...fade(0.05)}>
            <Logo height={72} />
          </motion.div>

          <motion.nav
            className="header-nav hidden lg:flex"
            aria-label="منوی اصلی"
            {...fade(0.12)}
          >
            <div className="lux-nav-pill">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                const isServices = link.href === "/#services";

                if (isServices) {
                  return (
                    <div key={link.href} className="relative" ref={servicesRef}>
                      <button
                        type="button"
                        className={`nav-link ${active || servicesOpen || servicesActive ? "is-active" : ""}`}
                        onClick={() => setServicesOpen((v) => !v)}
                        aria-expanded={servicesOpen}
                        aria-haspopup="true"
                      >
                        <span className="nav-dot" aria-hidden="true" />
                        <span className="nav-link-text">{link.label}</span>
                        <ChevronDown
                          size={14}
                          className={`nav-caret ${servicesOpen ? "is-open" : ""}`}
                        />
                      </button>

                      <div className={`nav-dropdown ${servicesOpen ? "is-open" : ""}`} role="menu">
                        {SERVICES.map((service) => (
                          <Link
                            key={service.id}
                            href={service.href}
                            className="nav-dropdown-item"
                            role="menuitem"
                            onClick={() => setServicesOpen(false)}
                          >
                            <span className="nav-dropdown-index">{service.id}</span>
                            <span>
                              <strong>{service.title}</strong>
                              <small>{service.description}</small>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link ${active ? "is-active" : ""}`}
                  >
                    <span className="nav-dot" aria-hidden="true" />
                    <span className="nav-link-text">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.nav>

          <motion.div className="header-actions" {...fade(0.2)}>
            <Link href="/login" className="header-login-btn hidden lg:inline-flex">
              ورود
            </Link>
            <button
              type="button"
              className="header-menu-btn lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "بستن منو" : "باز کردن منو"}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </motion.div>
        </div>
      </motion.div>

      <div className={`header-mobile-panel lg:hidden ${open ? "is-open" : ""}`}>
        <div className="header-mobile-backdrop" onClick={() => setOpen(false)} />
        <div className="header-mobile-sheet">
          <nav className="flex flex-col gap-1" aria-label="منوی موبایل">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link nav-link--mobile ${isActive(link.href) ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mobile-services">
              <p>خدمات</p>
              {SERVICES.map((service) => (
                <Link key={service.id} href={service.href} onClick={() => setOpen(false)}>
                  {service.title}
                </Link>
              ))}
            </div>
            <Link
              href="/login"
              className="header-login-btn mt-4 w-full justify-center"
              onClick={() => setOpen(false)}
            >
              ورود به حساب
            </Link>
            <Link
              href="/contact"
              className="btn-signup mt-2 w-full justify-center"
              onClick={() => setOpen(false)}
            >
              <span className="btn-signup-shine" aria-hidden="true" />
              <span>تماس با ما</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
