"use client";

import Link from "next/link";
import EditableText from "@/components/cms-edit/EditableText";
import EditableImage from "@/components/cms-edit/EditableImage";
import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import type { PagesContent } from "@/lib/content-store";
import type { BlogPost } from "@/lib/blog-defaults";
import { isBlogPublished } from "@/lib/validation";

type Props = {
  blog: PagesContent["blog"];
  posts: BlogPost[];
  allPosts: BlogPost[];
};

export default function BlogPageContent({ blog, posts, allPosts }: Props) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const published = posts.filter(isBlogPublished);
  const postIndex = (post: BlogPost) => allPosts.findIndex((p) => p.id === post.id);

  return (
    <>
      <EditablePageHero
        labelPath="pages.blog.label"
        titlePath="pages.blog.title"
        introPath="pages.blog.intro"
        label={blog.label}
        title={blog.title}
        intro={blog.intro}
      />

      {published.length === 0 ? (
        <div className="lux-card text-center">
          <p className="text-muted">هنوز مقاله‌ای منتشر نشده است.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {published.map((post) => {
            const index = postIndex(post);
            const body = (
              <>
                <div className="blog-card-cover relative aspect-[16/10] overflow-hidden">
                  {edit || post.coverImage?.trim() ? (
                    <EditableImage
                      path={`blogPosts.${index}.coverImage`}
                      src={post.coverImage}
                      alt={post.coverAlt?.trim() || post.title}
                      fill
                      fillParent
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      uploadKind="blog"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <time className="text-xs text-muted" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
                  </time>
                  <EditableText path={`blogPosts.${index}.title`} as="h2" className="mt-2 text-lg font-bold leading-relaxed">
                    {post.title}
                  </EditableText>
                  <EditableText path={`blogPosts.${index}.excerpt`} as="p" className="mt-2 line-clamp-3 text-sm leading-7 text-muted" multiline>
                    {post.excerpt}
                  </EditableText>
                </div>
              </>
            );

            return (
              <article key={post.id} className="blog-card lux-card cms-editable-card overflow-hidden">
                {edit ? (
                  <div className="block">{body}</div>
                ) : (
                  <Link href={`/blog/${post.slug}`} className="block">
                    {body}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
