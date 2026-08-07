"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { getMobileNavLabel, getServiceLinkLabel } from "@/lib/seo-nav-labels";
import type { LinkItem, ServiceItem } from "@/lib/landing-defaults";
import { defaultServices } from "@/lib/landing-defaults";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import EditableLogo from "@/components/cms-edit/EditableLogo";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import CmsEditPopover from "@/components/cms-edit/CmsEditPopover";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function Header({ initialLogoUrl }: { initialLogoUrl?: string }) {
  const pathname = usePathname();
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? cms?.content?.site?.logoUrl ?? "/images/logo.png");
  const [services, setServices] = useState<ServiceItem[]>(
    () =>
      Array.isArray(cms?.content?.pages?.services) && cms.content.pages.services.length > 0
        ? cms.content.pages.services
        : defaultServices,
  );
  const [navLinks, setNavLinks] = useState<LinkItem[]>(() =>
    Array.isArray(cms?.content?.site?.navLinks) && cms.content.site.navLinks.length > 0
      ? cms.content.site.navLinks
      : NAV_LINKS.map((l) => ({ ...l })),
  );
  const [landing, setLanding] = useState<LandingContent>(() => cms?.landing ?? defaultLanding);
  const [portalReady, setPortalReady] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (cms?.content) return;
    fetch("/api/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.site?.logoUrl) setLogoUrl(data.site.logoUrl);
        if (Array.isArray(data?.pages?.services) && data.pages.services.length > 0) {
          setServices(data.pages.services);
        }
        if (Array.isArray(data?.site?.navLinks) && data.site.navLinks.length > 0) {
          setNavLinks(data.site.navLinks);
        }
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, [cms?.content, initialLogoUrl]);

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

  const mobilePanel = (
    <div className={`header-mobile-panel lg:hidden ${open ? "is-open" : ""}`}>
      <div className="header-mobile-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="header-mobile-sheet">
        <nav className="flex flex-col gap-1" aria-label="منوی موبایل">
          {navLinks.map((link, navIndex) =>
            edit ? (
              <div key={link.href} className="nav-link nav-link--mobile cms-editable-card">
                <EditableText path={`site.navLinks.${navIndex}.label`}>{link.label}</EditableText>
                <CmsEditPopover
                  buttonLabel="🔗"
                  fields={[{ path: `site.navLinks.${navIndex}.href`, label: "لینk", dir: "ltr" }]}
                />
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link nav-link--mobile ${isActive(link.href) ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {getMobileNavLabel(link.href, link.label)}
              </Link>
            ),
          )}
          <div className="mobile-services">
            <EditableText path="landing.headerMobileServicesLabel">{landing.headerMobileServicesLabel}</EditableText>
            {services.map((service, index) =>
              edit ? (
                <div key={service.id} className="cms-editable-card py-2">
                  <EditableText path={`pages.services.${index}.title`}>{service.title}</EditableText>
                  <CmsEditPopover
                    buttonLabel="🔗"
                    fields={[{ path: `pages.services.${index}.href`, label: "لینk", dir: "ltr" }]}
                  />
                </div>
              ) : (
                <Link key={service.id} href={service.href} onClick={() => setOpen(false)}>
                  {getServiceLinkLabel(service.href, service.slug, service.title, "mobile")}
                </Link>
              ),
            )}
          </div>
          <EditableCta
            labelPath="landing.headerMobileLoginLabel"
            hrefPath="landing.headerLoginHref"
            label={landing.headerMobileLoginLabel}
            href={landing.headerLoginHref}
            className="header-login-btn mt-4 w-full justify-center"
            onClick={() => setOpen(false)}
          />
          <EditableCta
            labelPath="landing.headerContactButton"
            hrefPath="landing.headerContactHref"
            label={landing.headerContactButton}
            href={landing.headerContactHref}
            className="btn-signup mt-2 w-full justify-center"
            onClick={() => setOpen(false)}
          />
        </nav>
      </div>
    </div>
  );

  return (
    <header className={`lux-header ${scrolled ? "is-scrolled" : ""}`}>
      <motion.div
        className="lux-header-shell"
        initial={reducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="header-bar">
          <motion.div className="header-brand min-w-0" {...fade(0.05)}>
            <EditableLogo logoUrl={logoUrl} />
          </motion.div>

          <motion.nav
            className="header-nav hidden lg:flex"
            aria-label="منوی اصلی"
            {...fade(0.12)}
          >
            <div className="lux-nav-pill">
              {navLinks.map((link, navIndex) => {
                const active = isActive(link.href);
                const isServices = link.href === "/#services";

                const navLabel = edit ? (
                  <EditableText path={`site.navLinks.${navIndex}.label`}>{link.label}</EditableText>
                ) : (
                  link.label
                );

                if (isServices) {
                  if (edit) {
                    return (
                      <div key={link.href} className="relative" ref={servicesRef}>
                        <div
                          className={`nav-link cms-editable-card ${active || servicesOpen || servicesActive ? "is-active" : ""}`}
                        >
                          <span className="nav-dot" aria-hidden="true" />
                          <span className="nav-link-text">{navLabel}</span>
                          <CmsEditPopover
                            buttonLabel="🔗"
                            fields={[{ path: `site.navLinks.${navIndex}.href`, label: "لینk", dir: "ltr" }]}
                          />
                          <button
                            type="button"
                            className="nav-caret-btn"
                            onClick={() => setServicesOpen((v) => !v)}
                            aria-expanded={servicesOpen}
                            aria-haspopup="true"
                            aria-label="باز کردن منوی خدمات"
                          >
                            <ChevronDown
                              size={14}
                              className={`nav-caret ${servicesOpen ? "is-open" : ""}`}
                            />
                          </button>
                        </div>

                        <div className={`nav-dropdown ${servicesOpen ? "is-open" : ""}`} role="menu">
                          {services.map((service, index) => (
                            <div key={service.id} className="nav-dropdown-item cms-editable-card">
                              <span className="nav-dropdown-index">{service.id}</span>
                              <span>
                                <EditableText path={`pages.services.${index}.title`} className="block font-bold">
                                  {service.title}
                                </EditableText>
                                <EditableText path={`pages.services.${index}.description`} className="block text-xs opacity-80" multiline>
                                  {service.description}
                                </EditableText>
                                <CmsEditPopover
                                  buttonLabel="🔗"
                                  fields={[{ path: `pages.services.${index}.href`, label: "لینk", dir: "ltr" }]}
                                />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

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
                        {services.map((service) => (
                          <div key={service.id} className="nav-dropdown-item">
                            <span className="nav-dropdown-index">{service.id}</span>
                            <span>
                              <Link
                                href={service.href}
                                role="menuitem"
                                className="nav-dropdown-link"
                                onClick={() => setServicesOpen(false)}
                              >
                                {getServiceLinkLabel(service.href, service.slug, service.title, "dropdown")}
                              </Link>
                              <small className="nav-dropdown-desc">{service.description}</small>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (edit) {
                  return (
                    <div key={link.href} className={`nav-link cms-editable-card ${active ? "is-active" : ""}`}>
                      <span className="nav-dot" aria-hidden="true" />
                      <span className="nav-link-text">{navLabel}</span>
                      <CmsEditPopover
                        buttonLabel="🔗"
                        fields={[{ path: `site.navLinks.${navIndex}.href`, label: "لینk", dir: "ltr" }]}
                      />
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

          <motion.div className="header-actions shrink-0" {...fade(0.2)}>
            <EditableCta
              labelPath="landing.headerLoginLabel"
              hrefPath="landing.headerLoginHref"
              label={landing.headerLoginLabel}
              href={landing.headerLoginHref}
              className="header-login-btn hidden lg:inline-flex"
            />
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

      {portalReady ? createPortal(mobilePanel, document.body) : null}
    </header>
  );
}
