import type { SiteContent } from "@/lib/content-store";
import { findUserById } from "@/lib/auth";
import { isBlogPublished } from "@/lib/validation";

/** Strip draft blog posts from public API responses. */
export function toPublicApiContent(content: SiteContent): SiteContent {
  return {
    ...content,
    blogPosts: content.blogPosts.filter(isBlogPublished),
  };
}

export function isVerifiedAdminSession(
  session: { userId: number; role: string } | null | undefined,
): boolean {
  if (!session || session.role !== "admin") return false;
  const admin = findUserById(session.userId);
  return Boolean(admin && !admin.blocked && admin.role === "admin");
}
