import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import BlogPostPageContent from "@/components/pages/BlogPostPageContent";
import { readPublicSiteContent } from "@/lib/content-store";
import { findRedirect } from "@/lib/redirects";
import { buildPageMetadata } from "@/lib/seo";
import { isBlogPublished } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const post = content.blogPosts.find((p) => p.slug === slug && isBlogPublished(p));
  if (!post) return { title: "مقاله یافت نشد | لیوبیز" };
  return buildPageMetadata({
    title: `${post.title} | بلاگ لیوبیز`,
    description: post.excerpt,
    pathname: `/blog/${slug}`,
    ogImage: post.coverImage || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const index = content.blogPosts.findIndex((p) => p.slug === slug);
  const post = index >= 0 ? content.blogPosts[index] : undefined;

  if (!post || !isBlogPublished(post)) {
    const rule = findRedirect(`/blog/${slug}`, content.redirects || []);
    if (rule) redirect(rule.to);
    notFound();
  }

  return (
    <SiteShell>
      <article className="container mx-auto px-4 pb-20 pt-4 lg:px-8 lg:pb-28">
        <BlogPostPageContent post={post} index={index} />
      </article>
    </SiteShell>
  );
}
