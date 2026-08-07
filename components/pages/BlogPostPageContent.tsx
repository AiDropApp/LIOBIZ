"use client";

import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import EditableImage from "@/components/cms-edit/EditableImage";
import EditableMarkdown from "@/components/cms-edit/EditableMarkdown";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import type { BlogPost } from "@/lib/blog-defaults";

type Props = {
  post: BlogPost;
  index: number;
};

export default function BlogPostPageContent({ post, index }: Props) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;
  const base = `blogPosts.${index}`;
  const backLabel = cms?.getField("pages.blog.backLink", "← بازگشت به بلاگ") ?? "← بازگشت به بلاگ";
  const backHref = cms?.getField("pages.blog.backHref", "/blog") ?? "/blog";

  return (
    <>
      <EditableCta
        labelPath="pages.blog.backLink"
        hrefPath="pages.blog.backHref"
        label={backLabel}
        href={backHref}
        className="text-sm text-primary hover:underline"
      />

      <header className="mx-auto mt-6 max-w-3xl text-center">
        <time className="text-sm text-muted" dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString("fa-IR")} ·{" "}
          <EditableText path={`${base}.author`} className="inline">
            {post.author}
          </EditableText>
        </time>
        <EditableText path={`${base}.title`} as="h1" className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
          {post.title}
        </EditableText>
        <EditableText path={`${base}.excerpt`} as="p" className="mt-4 text-lg leading-8 text-muted" multiline>
          {post.excerpt}
        </EditableText>
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {post.tags.map((tag, tagIndex) => (
              <EditableText key={tag} path={`${base}.tags.${tagIndex}`} className="blog-tag">
                {tag}
              </EditableText>
            ))}
          </div>
        ) : null}
      </header>

      <div className="relative mx-auto mt-10 aspect-[16/9] max-w-4xl overflow-hidden rounded-2xl cms-editable-card">
        {edit || post.coverImage?.trim() ? (
          <EditableImage
            path={`${base}.coverImage`}
            src={post.coverImage}
            alt={post.coverAlt?.trim() || post.title}
            fill
            fillParent
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
            uploadKind="blog"
          />
        ) : null}
      </div>

      <div className="blog-article-body mx-auto mt-10 max-w-3xl">
        <EditableMarkdown
          path={`${base}.content`}
          fallback={post.content}
          paragraphClassName="text-muted leading-8 text-base"
        />
      </div>
    </>
  );
}
