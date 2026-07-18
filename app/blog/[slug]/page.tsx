import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import ContentImage from "@/components/ContentImage";
import CmsRichText from "@/components/CmsRichText";
import { readSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await readSiteContent();
  const post = content.blogPosts.find((p) => p.slug === slug && p.published);
  if (!post) return { title: "مقاله یافت نشد | لیوبیز" };
  return {
    title: `${post.title} | بلاگ لیوبیز`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const content = await readSiteContent();
  const post = content.blogPosts.find((p) => p.slug === slug && p.published);
  if (!post) notFound();

  return (
    <SiteShell>
      <article className="container mx-auto px-4 pb-20 pt-4 lg:px-8 lg:pb-28">
        <Link href="/blog" className="text-sm text-primary hover:underline">
          ← بازگشت به بلاگ
        </Link>

        <header className="mx-auto mt-6 max-w-3xl text-center">
          <time className="text-sm text-muted" dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("fa-IR")} · {post.author}
          </time>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted">{post.excerpt}</p>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="blog-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.coverImage && (
          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-4xl overflow-hidden rounded-2xl">
            <ContentImage
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        <div className="blog-article-body mx-auto mt-10 max-w-3xl">
          <CmsRichText content={post.content} paragraphClassName="text-muted leading-8 text-base" />
        </div>
      </article>
    </SiteShell>
  );
}
