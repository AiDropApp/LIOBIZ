"use client";

import dynamic from "next/dynamic";

/** Client-only overlay — must not block SSR content underneath. */
export const LoadingScreen = dynamic(() => import("@/components/LoadingScreen"), { ssr: false });

/** Below-fold sections stay SSR-enabled so visitors and crawlers see full content without JS. */
export const Portfolio = dynamic(() => import("@/components/Portfolio"));
export const Process = dynamic(() => import("@/components/Process"));
export const Backstage = dynamic(() => import("@/components/Backstage"));
export const Plans = dynamic(() => import("@/components/Plans"));
export const CreativePartners = dynamic(() => import("@/components/CreativePartners"));
export const FAQ = dynamic(() => import("@/components/FAQ"));
export const BlogSection = dynamic(() => import("@/components/BlogSection"));
export const Testimonials = dynamic(() => import("@/components/Testimonials"));
export const Partners = dynamic(() => import("@/components/Partners"));
