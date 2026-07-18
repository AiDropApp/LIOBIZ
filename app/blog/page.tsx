import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import ContentImage from "@/components/ContentImage";
import { readSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "بلاگ | لیوبیز",
    description: "مقالات تخصصی درباره برندینگ، دیجیتال مارکتینگ و رشد کسب‌وکار",
  };
}

export default async function BlogPage() {
  const content = await readSiteContent();
  const posts = content.blogPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero
          label="بلاگ"
          title="دانش و تجربه رشد برند"
          intro="مقالات تیم لیوبیز درباره استراتژی، محتوا، تبلیغات و ساخت برندهای ماندگار."
        />

        {posts.length === 0 ? (
          <div className="lux-card text-center">
            <p className="text-muted">هنوز مقاله‌ای منتشر نشده است.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="blog-card lux-card overflow-hidden">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="blog-card-cover relative aspect-[16/10] overflow-hidden">
                    <ContentImage
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <time className="text-xs text-muted" dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
                    </time>
                    <h2 className="mt-2 text-lg font-bold leading-relaxed">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{post.excerpt}</p>
                    {post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="blog-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
