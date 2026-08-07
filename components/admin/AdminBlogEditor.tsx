"use client";

import { useCallback, useEffect, useState } from "react";
import type { BlogPost } from "@/lib/blog-defaults";
import { slugifyBlogTitle } from "@/lib/blog-defaults";
import { normalizeBlogTags } from "@/lib/validation";
import { CMS_RICH_TEXT_HINT } from "@/lib/cms-rich-text";
import type { SiteContent } from "@/lib/content-store";
import MediaUrlField, { uploadBlogMedia } from "@/components/admin/landing/MediaUrlField";

function emptyPost(): BlogPost {
  return {
    id: `post-${Date.now()}`,
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    coverAlt: "",
    author: "تیم لیوبیز",
    publishedAt: new Date().toISOString(),
    published: false,
    tags: [],
    category: "",
  };
}

export default function AdminBlogEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [contentUploadBusy, setContentUploadBusy] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (res.ok) setContent(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  };

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next || editing!.tags.includes(next)) return;
    setEditing({ ...editing!, tags: [...editing!.tags, next] });
  };

  const removeTag = (tag: string) => {
    setEditing({ ...editing!, tags: editing!.tags.filter((t) => t !== tag) });
  };

  const appendContentLine = (line: string) => {
    if (!editing) return;
    const prefix = editing.content.trim() ? "\n\n" : "";
    setEditing({ ...editing, content: `${editing.content}${prefix}${line}` });
  };

  const uploadContentMedia = async (file: File, kind: "image" | "video" | "audio") => {
    setContentUploadBusy(true);
    try {
      const url = await uploadBlogMedia(file);
      const alt = file.name.replace(/\.[^.]+$/, "") || "فایل";
      const line =
        kind === "image" ? `![${alt}](${url})` : kind === "video" ? `::video ${url}` : `::audio ${url}`;
      appendContentLine(line);
      flash("فایل به محتوا اضافه شد.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "خطا در آپلود");
    } finally {
      setContentUploadBusy(false);
    }
  };

  const savePosts = async (posts: BlogPost[]) => {
    setBusy(true);
    try {
      const res = await fetch("/api/content/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogPosts: posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا");
      setContent(data.content);
      flash("بلاگ ذخیره شد.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const upsertPost = async () => {
    if (!content || !editing) return;
    const title = editing.title.trim();
    if (!title) return flash("عنوان الزامی است");

    const slug = (editing.slug.trim() || slugifyBlogTitle(title)).replace(/^-+|-+$/g, "");
    if (!slug) return flash("اسلاگ معتبر نیست");

    const nextPost: BlogPost = {
      ...editing,
      title,
      slug,
      excerpt: editing.excerpt.trim(),
      content: editing.content.trim(),
      coverImage: editing.coverImage.trim(),
      coverAlt: editing.coverAlt?.trim() || "",
      category: editing.category?.trim() || "",
      author: editing.author.trim() || "تیم لیوبیز",
      tags: editing.tags.map((t) => t.trim()).filter(Boolean),
    };

    const exists = content.blogPosts.some((p) => p.id === nextPost.id);
    const posts = exists
      ? content.blogPosts.map((p) => (p.id === nextPost.id ? nextPost : p))
      : [nextPost, ...content.blogPosts];

    await savePosts(posts);
    setEditing(null);
  };

  const deletePost = async (id: string) => {
    if (!content || !confirm("این مقاله حذف شود؟")) return;
    const post = content.blogPosts.find((p) => p.id === id);
    const redirects = [...(content.redirects || [])];
    if (post?.slug) {
      const from = `/blog/${post.slug}`;
      if (!redirects.some((r) => r.from === from)) {
        redirects.push({ from, to: "/blog", permanent: true });
      }
    }
    setBusy(true);
    try {
      const res = await fetch("/api/content/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPosts: content.blogPosts.filter((p) => p.id !== id),
          redirects,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا");
      setContent(data.content);
      flash("مقاله حذف شد — ریدایرکت ۳۰۱ به /blog اضافه شد.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  if (!content) {
    return <p className="text-muted p-4">در حال بارگذاری بلاگ...</p>;
  }

  const posts = [...content.blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <section className="landing-admin">
      <div className="dash-section-head">
        <h2>مدیریت بلاگ</h2>
        <p>مقالات را بنویسید، منتشر کنید و در /blog نمایش دهید.</p>
        <a href="/blog" target="_blank" rel="noreferrer" className="btn-outline mt-3 inline-flex text-sm">
          پیش‌نمایش بلاگ ↗
        </a>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}

      <div className="dash-toolbar">
        <button type="button" className="btn-primary" onClick={() => setEditing(emptyPost())}>
          مقاله جدید
        </button>
      </div>

      {editing && (
        <div className="lux-card mt-4 space-y-3 p-4">
          <h3 className="text-lg font-bold">{posts.some((p) => p.id === editing.id) ? "ویرایش مقاله" : "مقاله جدید"}</h3>

          <label className="contact-field">
            <span>عنوان</span>
            <input
              value={editing.title}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  title: e.target.value,
                  slug: editing.slug || slugifyBlogTitle(e.target.value),
                })
              }
            />
          </label>

          <label className="contact-field">
            <span>اسلاگ (URL)</span>
            <input dir="ltr" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
          </label>

          <label className="contact-field">
            <span>خلاصه</span>
            <textarea rows={2} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
          </label>

          <label className="contact-field">
            <span>محتوا</span>
            <textarea rows={10} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            <small className="text-muted">{CMS_RICH_TEXT_HINT}</small>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="btn-outline text-sm cursor-pointer">
                {contentUploadBusy ? "در حال آپلود…" : "افزودن تصویر به متن"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={contentUploadBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadContentMedia(file, "image");
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="btn-outline text-sm cursor-pointer">
                {contentUploadBusy ? "در حال آپلود…" : "افزودن ویدیو به متن"}
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  disabled={contentUploadBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadContentMedia(file, "video");
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="btn-outline text-sm cursor-pointer">
                {contentUploadBusy ? "در حال آپلود…" : "افزودن صوت به متن"}
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  disabled={contentUploadBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadContentMedia(file, "audio");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </label>

          <MediaUrlField
            label="تصویر کاور"
            value={editing.coverImage}
            onChange={(url) => setEditing({ ...editing, coverImage: url })}
            uploadKind="blog"
            accept="image/*"
            hint="فایل روی سرور ذخیره می‌شود. آدرس /media/... یا لینک مستقیم."
          />

          <label className="contact-field">
            <span>متن جایگزین تصویر (alt)</span>
            <input
              value={editing.coverAlt || ""}
              onChange={(e) => setEditing({ ...editing, coverAlt: e.target.value })}
              placeholder="توضیح تصویر برای سئو و دسترس‌پذیری"
            />
          </label>

          <label className="contact-field">
            <span>دسته‌بندی</span>
            <input
              list="blog-categories-list"
              value={editing.category || ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              placeholder="مثلاً تولید محتوا"
            />
            <datalist id="blog-categories-list">
              {(content.blogCategories || []).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="contact-field">
            <span>تاریخ انتشار</span>
            <input
              type="datetime-local"
              value={editing.publishedAt ? editing.publishedAt.slice(0, 16) : ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  publishedAt: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                })
              }
            />
            <small className="text-muted">برای زمان‌بندی آینده، تاریخ آینده انتخاب کنید.</small>
          </label>

          <label className="contact-field">
            <span>نویسنده</span>
            <input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
          </label>

          <div className="contact-field">
            <span>برچسب‌ها</span>
            <div className="flex flex-wrap gap-2 mb-2">
              {editing.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="blog-tag inline-flex items-center gap-1"
                  onClick={() => removeTag(tag)}
                  title="حذف برچسب"
                >
                  {tag} ×
                </button>
              ))}
            </div>
            <input
              value={tagInput}
              placeholder="برچسب — Enter یا کاما (,) برای افزودن"
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "," || e.key === "،") {
                  e.preventDefault();
                  const parts = normalizeBlogTags(tagInput);
                  if (parts.length > 1) {
                    parts.forEach((t) => addTag(t));
                  } else {
                    addTag(tagInput);
                  }
                  setTagInput("");
                }
              }}
              onBlur={() => {
                if (!tagInput.trim()) return;
                normalizeBlogTags(tagInput).forEach((t) => addTag(t));
                setTagInput("");
              }}
            />
          </div>

          <label className="contact-field flex-row items-center gap-2">
            <input
              type="checkbox"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
            />
            <span>منتشر شده</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={upsertPost}>
              {busy ? "در حال ذخیره..." : "ذخیره مقاله"}
            </button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              انصراف
            </button>
          </div>
        </div>
      )}

      <div className="dash-list mt-5">
        {posts.length === 0 ? (
          <div className="dash-empty lux-card">
            <h3>مقاله‌ای ثبت نشده</h3>
            <p>اولین مقاله بلاگ را بسازید.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="lux-card dash-message">
              <div className="dash-message-top">
                <div>
                  <h3>{post.title}</h3>
                  <p dir="ltr">/blog/{post.slug}</p>
                </div>
                <span className={`dash-badge ${post.published ? "order-completed" : "order-cancelled"}`}>
                  {post.published ? "منتشر شده" : "پیش‌نویس"}
                </span>
              </div>
              <p className="dash-message-body">{post.excerpt}</p>
              <div className="dash-message-actions">
                <button type="button" className="btn-outline" onClick={() => setEditing(post)}>
                  ویرایش
                </button>
                <button type="button" className="btn-primary" onClick={() => deletePost(post.id)}>
                  حذف
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
