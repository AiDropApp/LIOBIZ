"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LandingContent } from "@/lib/cms-defaults";
import type { BlogPost } from "@/lib/blog-defaults";
import type { BackstageItem, PortfolioCategory, PortfolioItem } from "@/lib/content-store";
import type {
  CreativePartnerItem,
  FaqItem,
  PartnerItem,
  PlanItem,
  ProcessStepItem,
  TeamStatItem,
  TestimonialItem,
} from "@/lib/landing-defaults";

export type HomePageData = {
  landing: LandingContent;
  portfolio: PortfolioItem[];
  portfolioCategories: PortfolioCategory[];
  processSteps: ProcessStepItem[];
  backstage: BackstageItem[];
  teamStats: TeamStatItem[];
  plans: PlanItem[];
  creativePartners: CreativePartnerItem[];
  faq: FaqItem[];
  blogPosts: BlogPost[];
  testimonials: TestimonialItem[];
  partners: PartnerItem[];
};

const HomeDataContext = createContext<HomePageData | null>(null);

export function HomeDataProvider({ value, children }: { value: HomePageData; children: ReactNode }) {
  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}

export function useHomeData(): HomePageData {
  const ctx = useContext(HomeDataContext);
  if (!ctx) throw new Error("useHomeData must be used within HomeDataProvider");
  return ctx;
}

/** Optional hook for sections that may render outside homepage. */
export function useHomeDataOptional(): HomePageData | null {
  return useContext(HomeDataContext);
}
