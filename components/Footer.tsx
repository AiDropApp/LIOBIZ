"use client";

import { useEffect, useState } from "react";
import { Instagram, Linkedin, Send, Phone, Mail, MapPin, Facebook, Youtube } from "lucide-react";
import Link from "next/link";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";
import EditableText from "@/components/cms-edit/EditableText";
import EditableRichText from "@/components/cms-edit/EditableRichText";
import EditableCta from "@/components/cms-edit/EditableCta";
import CmsEditPopover from "@/components/cms-edit/CmsEditPopover";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import {
  defaultFooterQuickLinks,
  defaultFooterServiceLinks,
  type LinkItem,
} from "@/lib/landing-defaults";
import SocialShare from "@/components/SocialShare";

function inferSocialPlatform(name: string, href: string): string {
  const url = href.toLowerCase();
  if (url.includes("behance")) return "Behance";
  if (url.includes("facebook.com") || url.includes("fb.com")) return "Facebook";
  if (url.includes("instagram")) return "Instagram";
  if (url.includes("linkedin")) return "LinkedIn";
  if (url.includes("telegram") || url.includes("t.me")) return "Telegram";
  if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "X";
  return name.trim() || "Social";
}

function dedupeSocialsByHref(socials: Array<{ name: string; href: string }>) {
  const seen = new Set<string>();
  return socials.filter((link) => {
    const href = link.href?.trim();
    if (!href || seen.has(href)) return false;
    seen.add(href);
    return true;
  });
}

function SocialIcon({ name }: { name: string }) {
  if (name === "Instagram") return <Instagram size={18} />;
  if (name === "LinkedIn") return <Linkedin size={18} />;
  if (name === "Telegram") return <Send size={18} />;
  if (name === "Facebook") return <Facebook size={18} />;
  if (name === "YouTube") return <Youtube size={18} />;
  if (name === "X") return <span className="text-xs font-bold" aria-hidden="true">X</span>;
  if (name === "Behance") return <span className="text-xs font-bold" aria-hidden="true">Be</span>;
  return <span className="text-xs font-bold" aria-hidden="true">{name.charAt(0)}</span>;
}

type SiteInfo = {
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  footerText?: string;
  brandDisplayName?: string;
  socials?: Array<{ name: string; href: string }>;
};

export default function Footer() {
  const cms = useCmsEdit();
  const [landing, setLanding] = useState<LandingContent>(() => cms?.landing ?? defaultLanding);
  const [quickLinks, setQuickLinks] = useState<LinkItem[]>(
    () => cms?.content?.footerQuickLinks ?? defaultFooterQuickLinks,
  );
  const [serviceLinks, setServiceLinks] = useState<LinkItem[]>(
    () => cms?.content?.footerServiceLinks ?? defaultFooterServiceLinks,
  );
  const [site, setSite] = useState<SiteInfo>(() => {
    const cmsSite = cms?.content?.site as (SiteInfo & { streetAddress?: string; addressLocality?: string; addressRegion?: string }) | undefined;
    return {
      description: cmsSite?.description || SITE.description,
      phone: cmsSite?.phone || SITE.phone,
      email: cmsSite?.email || SITE.email,
      address: cmsSite?.address || SITE.address,
      streetAddress: cmsSite?.streetAddress || SITE.streetAddress,
      addressLocality: cmsSite?.addressLocality || SITE.addressLocality,
      addressRegion: cmsSite?.addressRegion || SITE.addressRegion,
      footerText: cmsSite?.footerText || cmsSite?.description || SITE.description,
      brandDisplayName: cmsSite?.brandDisplayName || "LIOBIZ",
      socials:
        Array.isArray(cmsSite?.socials) && cmsSite.socials.length > 0 ? cmsSite.socials : SOCIAL_LINKS,
    };
  });

  useEffect(() => {
    if (cms?.content) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
        if (Array.isArray(data?.footerQuickLinks)) setQuickLinks(data.footerQuickLinks);
        if (Array.isArray(data?.footerServiceLinks)) setServiceLinks(data.footerServiceLinks);
        if (data?.site) {
          setSite({
            description: data.site.description || SITE.description,
            phone: data.site.phone || SITE.phone,
            email: data.site.email || SITE.email,
            address: data.site.address || SITE.address,
            streetAddress: data.site.streetAddress || SITE.streetAddress,
            addressLocality: data.site.addressLocality || SITE.addressLocality,
            addressRegion: data.site.addressRegion || SITE.addressRegion,
            footerText: data.site.footerText || data.site.description || SITE.description,
            brandDisplayName: data.site.brandDisplayName || "LIOBIZ",
            socials:
              Array.isArray(data.site.socials) && data.site.socials.length > 0
                ? data.site.socials
                : SOCIAL_LINKS,
          });
        }
      })
      .catch(() => undefined);
  }, [cms?.content]);

  const phone = site.phone || SITE.phone;
  const email = site.email || SITE.email;
  const socials = dedupeSocialsByHref(site.socials || SOCIAL_LINKS);

  return (
    <footer id="contact" className="site-footer">
      <div className="footer-panel">
        <div className="footer-panel-inner">
          <div className="footer-cta mb-14 flex flex-col items-center gap-5 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] px-6 py-8 text-center md:flex-row md:justify-between md:px-8 md:text-right">
            <div>
              <EditableText path="landing.footerCtaTitle" as="p" className="footer-cta-title text-2xl font-bold md:text-3xl">
                {landing.footerCtaTitle}
              </EditableText>
              <EditableRichText path="landing.footerCtaText" fallback={landing.footerCtaText} className="mt-2" />
            </div>
            {cms?.isAdmin && cms.editMode ? (
              <div className="flex flex-col items-center gap-2">
                <EditableText path="landing.footerCtaButton" className="btn-accent px-8">
                  {landing.footerCtaButton}
                </EditableText>
                <EditableText path="landing.footerCtaHref" dir="ltr" className="cms-cta-href">
                  {landing.footerCtaHref}
                </EditableText>
              </div>
            ) : (
              <Link href={landing.footerCtaHref} className="btn-accent px-8">
                {landing.footerCtaButton}
              </Link>
            )}
          </div>

          <div className="footer-main-grid">
            <div className="footer-brand-col">
              <EditableText path="site.brandDisplayName" as="p" className="mb-2 text-xl font-extrabold tracking-wide text-white">
                {site.brandDisplayName || "LIOBIZ"}
              </EditableText>
              <p className="mb-5 max-w-sm leading-relaxed text-muted">
                <EditableText path="site.footerText" multiline>
                  {site.footerText || site.description || SITE.description}
                </EditableText>
              </p>
              <div className="footer-socials footer-socials--icons">
                {socials.map((link, index) => {
                  const platform = inferSocialPlatform(link.name, link.href);
                  return cms?.isAdmin && cms.editMode ? (
                    <div key={`${link.href}-${index}`} className="footer-social cms-editable-card relative">
                      <SocialIcon name={platform} />
                      <CmsEditPopover
                        className="cms-edit-popover-wrap--social"
                        buttonLabel="✏️"
                        fields={[
                          { path: `site.socials.${index}.name`, label: "نام" },
                          { path: `site.socials.${index}.href`, label: "لینk", dir: "ltr" },
                        ]}
                      />
                    </div>
                  ) : (
                    <a
                      key={`${link.href}-${index}`}
                      href={link.href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="footer-social footer-social--icon-only"
                      aria-label={platform}
                      title={platform}
                    >
                      <SocialIcon name={platform} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="footer-links-col">
              <EditableText path="landing.footerQuickLinksTitle" as="p" className="footer-col-title mb-4 text-lg font-bold">
                {landing.footerQuickLinksTitle}
              </EditableText>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={`${link.href}-${index}`} className="cms-editable-card">
                    {cms?.isAdmin && cms.editMode ? (
                      <div className="space-y-1">
                        <EditableText path={`footerQuickLinks.${index}.label`}>{link.label}</EditableText>
                        <CmsEditPopover
                          buttonLabel="🔗"
                          fields={[{ path: `footerQuickLinks.${index}.href`, label: "لینk", dir: "ltr" }]}
                        />
                      </div>
                    ) : (
                      <Link href={link.href} className="text-muted transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-col">
              <EditableText path="landing.footerServicesTitle" as="p" className="footer-col-title mb-4 text-lg font-bold">
                {landing.footerServicesTitle}
              </EditableText>
              <ul className="space-y-3">
                {serviceLinks.map((link, index) => (
                  <li key={`${link.label}-${index}`} className="cms-editable-card">
                    {cms?.isAdmin && cms.editMode ? (
                      <div className="space-y-1">
                        <EditableText path={`footerServiceLinks.${index}.label`}>{link.label}</EditableText>
                        <CmsEditPopover
                          buttonLabel="🔗"
                          fields={[{ path: `footerServiceLinks.${index}.href`, label: "لینk", dir: "ltr" }]}
                        />
                      </div>
                    ) : (
                      <Link href={link.href} className="text-muted transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-contact-col">
              <EditableText path="landing.footerContactTitle" as="p" className="footer-col-title mb-4 text-lg font-bold">
                {landing.footerContactTitle}
              </EditableText>
              <ul className="space-y-3.5 text-muted">
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="transition-colors hover:text-white"
                    dir="ltr"
                  >
                    <EditableText path="site.phone" dir="ltr">
                      {phone}
                    </EditableText>
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  <a href={`mailto:${email}`} className="transition-colors hover:text-white" dir="ltr">
                    <EditableText path="site.email" dir="ltr">
                      {email}
                    </EditableText>
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  <address
                    className="not-italic leading-relaxed"
                    itemScope
                    itemType="https://schema.org/PostalAddress"
                  >
                    <span itemProp="streetAddress">
                      <EditableText path="site.streetAddress" as="span">
                        {site.streetAddress || SITE.streetAddress}
                      </EditableText>
                    </span>
                    {", "}
                    <span itemProp="addressLocality">
                      <EditableText path="site.addressLocality" as="span">
                        {site.addressLocality || SITE.addressLocality}
                      </EditableText>
                    </span>
                    {", "}
                    <span itemProp="addressRegion">
                      {site.addressRegion || SITE.addressRegion}
                    </span>
                    {", "}
                    <span itemProp="addressCountry">{SITE.addressCountry}</span>
                  </address>
                </li>
                <li>
                  <EditableCta
                    labelPath="landing.footerContactPageLink"
                    hrefPath="landing.footerContactPageHref"
                    label={landing.footerContactPageLink}
                    href={landing.footerContactPageHref}
                    className="text-primary transition-colors hover:text-white"
                  />
                </li>
              </ul>
            </div>

            <aside className="footer-share-aside">
              <SocialShare layout="vertical" />
            </aside>
          </div>

          <div className="footer-share-mobile">
            <SocialShare layout="horizontal" />
          </div>

          <div className="footer-copyright mt-12 border-t border-white/5 pt-6 text-center text-sm text-white/40">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            <EditableText path="landing.footerCopyright" as="span">
              {landing.footerCopyright}
            </EditableText>
          </div>
        </div>
      </div>
    </footer>
  );
}
