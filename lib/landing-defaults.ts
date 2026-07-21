import {
  FAQ_ITEMS,
  PARTNERS,
  PLANS,
  PROCESS_STEPS,
  SERVICES,
  STATS,
  TEAM_STATS,
  TESTIMONIALS,
  FOOTER_QUICK_LINKS,
  FOOTER_SERVICES,
} from "@/lib/constants";
import { CREATIVE_PARTNERS } from "@/lib/creative-partners.data";
import { normalizeMediaFields, type CmsMediaFields } from "@/lib/media-types";

export type HeroStatItem = { value: string; label: string; icon: string };
export type ServiceItem = {
  id: string;
  slug?: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};
export type ProcessStepItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};
export type PlanItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  featured: boolean;
  features: string[];
};
export type FaqItem = { q: string; a: string };
export type TestimonialItem = {
  name: string;
  role: string;
  quote: string;
};
export type PartnerItem = { name: string; logo: string; href?: string };
export type TeamStatItem = { label: string; value: string; icon: string };
export type LinkItem = { label: string; href: string };
export type CreativePartnerItem = {
  id: string;
  name: string;
  role: string;
  showcase: string;
  bio: string;
  quote: string;
  videoSrc: string;
  avatarSrc: string;
  /** When avatar is a video file, render with <video> instead of <img>. */
  avatarVideoSrc?: string;
  image?: string;
} & CmsMediaFields;

export const defaultHeroStats: HeroStatItem[] = STATS.map((s) => ({
  value: s.value,
  label: s.label,
  icon: s.icon,
}));

export const defaultServices: ServiceItem[] = SERVICES.map((s) => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  description: s.description,
  href: s.href,
  icon: s.icon,
}));

export const defaultProcessSteps: ProcessStepItem[] = PROCESS_STEPS.map((s) => ({
  id: s.id,
  title: s.title,
  description: s.description,
  icon: s.icon,
}));

export const defaultPlans: PlanItem[] = PLANS.map((p) => ({ ...p }));
export const defaultFaq: FaqItem[] = FAQ_ITEMS.map((f) => ({ ...f }));
export const defaultTestimonials: TestimonialItem[] = TESTIMONIALS.map((t) => ({ ...t }));
export const defaultPartners: PartnerItem[] = PARTNERS.map((p) => ({ ...p }));
export const defaultTeamStats: TeamStatItem[] = TEAM_STATS.map((t) => ({ ...t }));
export const defaultFooterQuickLinks: LinkItem[] = FOOTER_QUICK_LINKS.map((l) => ({ ...l }));
export const defaultFooterServiceLinks: LinkItem[] = FOOTER_SERVICES.map((l) => ({ ...l }));
export const defaultCreativePartners: CreativePartnerItem[] = CREATIVE_PARTNERS.map((p) =>
  normalizeMediaFields({
    ...p,
    image: p.avatarSrc,
    mediaKind: p.videoSrc ? "video" : "image",
    aspectRatio: "landscape" as const,
  }),
);
