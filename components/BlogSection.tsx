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
import { HOME_BLOG_LIMIT } from "@/lib/homepage-limits";

function BlogCardMeta({ post, index, edit }: { post: BlogPost; index: number; edit?: boolean }) {
  return (
    <div className="blog-card-meta">
      <time className="blog-card-date" dateTime={post.publishedAt}>
        {new Date(post.publishedAt).toLocaleDateString("fa-IR")}
      </time>
      {post.category ? (
        edit ? (
          <EditableText path={`blogPosts.${index}.category`} as="span" className="blog-tag">
            {post.category}
          </EditableText>
        ) : (
          <span className="blog-tag">{post.category}</span>
        )
      ) : null}
    </div>
  );
}

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
            .slice(0, HOME_BLOG_LIMIT),
        );
      })
      .catch(() => undefined);
  }, [home?.blogPosts, initialPosts]);

  if (posts.length === 0 && !edit) return null;

  return (
    <section id="blog" className="section-block blog-home-section blog-home-section--pre-footer">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="blog-section-header">
          <LandingSectionHeader
            labelPath="pages.blog.label"
            titlePath="pages.blog.title"
            label={blogPage.label}
            title={blogPage.title}
            className="blog-section-heading"
          />
          <EditableCta
            labelPath="landing.blogViewAllCta"
            hrefPath="landing.blogViewAllHref"
            label={landing.blogViewAllCta}
            href={landing.blogViewAllHref}
            className="btn-outline blog-section-cta shrink-0"
          />
        </div>

        <div className={`blog-home-grid blog-home-grid--count-${Math.min(posts.length, 3)}`}>
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
                <div className="blog-card-body p-5">
                  <BlogCardMeta post={post} index={index} edit={edit} />
                  <EditableText path={`blogPosts.${index}.title`} as="h3" className="blog-card-title">
                    {post.title}
                  </EditableText>
                  <EditableText path={`blogPosts.${index}.excerpt`} as="p" className="blog-card-excerpt" multiline>
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
                    <div className="blog-card-body p-5">
                      <BlogCardMeta post={post} index={index} />
                      <h3 className="blog-card-title">
                        <Link href={`/blog/${post.slug}`} className="blog-card-title-link">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="blog-card-excerpt">{post.excerpt}</p>
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
