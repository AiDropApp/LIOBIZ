"use client";

import Link from "next/link";
import type { LandingContent } from "@/lib/cms-defaults";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useHomeLanding } from "@/hooks/useHomeLanding";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import EditableImage from "@/components/cms-edit/EditableImage";
import ContentImage from "@/components/ContentImage";
import LandingSectionHeader from "@/components/cms-edit/LandingSectionHeader";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { useEffect, useState } from "react";
import type { BlogPost } from "@/lib/blog-defaults";
import { BLOG_PAGE } from "@/lib/pages-content";
import { isBlogPublished } from "@/lib/validation";

export default function BlogSection({
  initialLanding,
  initialPosts,
}: {
  initialLanding?: LandingContent;
  initialPosts?: BlogPost[];
} = {}) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const home = useHomeDataOptional();
  const landing = useHomeLanding(initialLanding);
  const seededPosts = home?.blogPosts ?? initialPosts;
  const [posts, setPosts] = useState<BlogPost[]>(seededPosts ?? []);
  const [allPosts, setAllPosts] = useState<BlogPost[]>(seededPosts ?? []);
  const [blogPage, setBlogPage] = useState(BLOG_PAGE);

  useEffect(() => {
    if (home?.blogPosts || initialPosts) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.pages?.blog) setBlogPage(data.pages.blog);
        const list = Array.isArray(data?.blogPosts) ? data.blogPosts : [];
        setAllPosts(list);
        setPosts(
          list
            .filter(isBlogPublished)
            .sort((a: BlogPost, b: BlogPost) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, 3),
        );
      })
      .catch(() => undefined);
  }, [home?.blogPosts, initialPosts]);

  if (posts.length === 0 && !edit) return null;

  return (
    <section id="blog" className="section-padding">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <LandingSectionHeader
            labelPath="pages.blog.label"
            titlePath="pages.blog.title"
            label={blogPage.label}
            title={blogPage.title}
          />
          <EditableCta
            labelPath="landing.blogViewAllCta"
            hrefPath="landing.blogViewAllHref"
            label={landing.blogViewAllCta}
            href={landing.blogViewAllHref}
            className="btn-outline"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const index = allPosts.findIndex((p) => p.id === post.id);
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
                  {post.category ? <span className="blog-tag mr-2">{post.category}</span> : null}
                  <EditableText path={`blogPosts.${index}.title`} as="h3" className="mt-2 text-lg font-bold leading-relaxed">
                    {post.title}
                  </EditableText>
                  <EditableText path={`blogPosts.${index}.excerpt`} as="p" className="mt-2 line-clamp-2 text-sm leading-7 text-muted" multiline>
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
                  <>
                    <div className="blog-card-cover relative aspect-[16/10] overflow-hidden">
                      {post.coverImage?.trim() ? (
                        <ContentImage
                          src={post.coverImage}
                          alt={post.coverAlt?.trim() || post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <time className="text-xs text-muted" dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
                      </time>
                      {post.category ? <span className="blog-tag mr-2">{post.category}</span> : null}
                      <h3 className="mt-2 text-lg font-bold leading-relaxed">
                        <Link href={`/blog/${post.slug}`} className="blog-card-title-link">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
