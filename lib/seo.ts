import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const SEO_OG_IMAGE = "/icons/icon-512.png";

const DEFAULT_OG_IMAGE = {
  url: SEO_OG_IMAGE,
  width: 512,
  height: 512,
  alt: "لیوبیز",
};

/** Absolute canonical URL for a site-relative path (e.g. "/about" -> "https://liobiz.com/about"). */
export function canonicalUrl(pathname: string): string {
  const base = SITE.url.replace(/\/$/, "");
  if (!pathname || pathname === "/") return base;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  pathname: string;
  robots?: Metadata["robots"];
  ogImage?: string | { url: string; width?: number; height?: number; alt?: string };
  openGraph?: Partial<NonNullable<Metadata["openGraph"]>>;
  twitter?: Partial<NonNullable<Metadata["twitter"]>>;
};

/** Build consistent page metadata with canonical URL, Open Graph, and Twitter cards. */
export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const canonical = canonicalUrl(options.pathname);
  const ogImages = options.ogImage
    ? [typeof options.ogImage === "string" ? { url: options.ogImage } : options.ogImage]
    : [DEFAULT_OG_IMAGE];
  const twitterImages = ogImages.map((img) =>
    typeof img === "string" ? img : img.url
  );

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url: canonical,
      siteName: "لیوبیز",
      title: options.title,
      description: options.description,
      images: ogImages,
      ...options.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: twitterImages,
      ...options.twitter,
    },
    ...(options.robots !== undefined ? { robots: options.robots } : {}),
  };
}
