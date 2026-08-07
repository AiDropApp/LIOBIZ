import type { BlogPost } from "@/lib/blog-defaults";
import type { LandingContent } from "@/lib/cms-defaults";
import type { HomePageData } from "@/components/HomeDataProvider";
import type { SiteContent } from "@/lib/content-store";
import {
  HOME_BACKSTAGE_LIMIT,
  HOME_BLOG_LIMIT,
  HOME_CREATIVE_PARTNERS_LIMIT,
} from "@/lib/homepage-limits";
import { normalizePortfolioCategories } from "@/lib/portfolio";
import { isBlogPublished } from "@/lib/validation";

/** Strip heavy CMS fields before serializing to the client (smaller HTML / RSC payload). */
function slimBlogPosts(posts: BlogPost[]): BlogPost[] {
  return posts
    .filter(isBlogPublished)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, HOME_BLOG_LIMIT)
    .map(({ content: _content, ...rest }) => ({ ...rest, content: "" }));
}

export function buildHomePageClientPayload(
  content: SiteContent,
  landing: LandingContent,
): HomePageData {
  return {
    landing,
    portfolio: content.portfolio,
    portfolioCategories: normalizePortfolioCategories(content.portfolioCategories),
    processSteps: content.pages.processSteps,
    backstage: content.backstage.slice(0, HOME_BACKSTAGE_LIMIT),
    teamStats: content.teamStats,
    plans: content.plans,
    creativePartners: content.creativePartners.slice(0, HOME_CREATIVE_PARTNERS_LIMIT),
    faq: content.faq,
    blogPosts: slimBlogPosts(content.blogPosts),
    testimonials: content.testimonials,
    partners: content.partners,
  };
}
