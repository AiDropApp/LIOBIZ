import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import BlogPageContent from "@/components/pages/BlogPageContent";
import { readPublicSiteContent } from "@/lib/content-store";
import { buildPageMetadata } from "@/lib/seo";
import { isBlogPublished } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "بلاگ | لیوبیز",
    description: "مقالات تخصصی درباره برندینگ، دیجیتال مارکتینگ و رشد کسب‌وکار",
    pathname: "/blog",
  });
}

export default async function BlogPage() {
  const content = await readPublicSiteContent();
  const posts = content.blogPosts
    .filter(isBlogPublished)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <BlogPageContent blog={content.pages.blog} posts={posts} allPosts={content.blogPosts} />
      </div>
    </SiteShell>
  );
}
