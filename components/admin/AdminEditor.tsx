"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentImage from "@/components/ContentImage";
import MediaItemFields from "@/components/admin/landing/MediaItemFields";
import LandingItemCard from "@/components/admin/landing/LandingItemCard";
import {
  needsIframeVideoEmbed,
  resolveMediaKind,
  toGoogleDriveThumbnailUrl,
  toPlayableVideoUrl,
  type MediaAspect,
  type MediaKind,
} from "@/lib/media-types";
import type { BackstageItem, PortfolioItem, SiteContent } from "@/lib/content-store";
import { sortCategories } from "@/lib/portfolio";

type Tab = "portfolio" | "backstage";

type PortfolioForm = {
  title: string;
  categoryId: string;
  image: string;
  videoSrc: string;
  mediaKind: MediaKind;
  aspectRatio: MediaAspect;
  description: string;
  client: string;
  year: string;
};

type BackstageForm = {
  caption: string;
  image: string;
  videoSrc: string;
  mediaKind: MediaKind;
  aspectRatio: MediaAspect;
};

const emptyPortfolio = (categoryId = ""): PortfolioForm => ({
  title: "",
  categoryId,
  image: "",
  videoSrc: "",
  mediaKind: "image",
  aspectRatio: "portrait",
  description: "",
  client: "",
  year: "",
});

const emptyBackstage: BackstageForm = {
  caption: "",
  image: "",
  videoSrc: "",
  mediaKind: "image",
  aspectRatio: "portrait",
};

export default function AdminEditor({
  embedded = false,
  compact = false,
  sectionOnly,
  onContentChange,
}: {
  embedded?: boolean;
  compact?: boolean;
  sectionOnly?: Tab;
  onContentChange?: (content: SiteContent) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(sectionOnly ?? "portfolio");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolio());
  const [backstageForm, setBackstageForm] = useState(emptyBackstage);

  const categories = useMemo(
    () => sortCategories(content?.portfolioCategories || []),
    [content?.portfolioCategories],
  );

  const isPortfolioDraftDirty = useMemo(
    () =>
      Boolean(
        portfolioForm.title.trim() ||
          portfolioForm.image.trim() ||
          portfolioForm.videoSrc.trim() ||
          portfolioForm.description.trim() ||
          portfolioForm.client.trim() ||
          portfolioForm.year.trim(),
      ),
    [portfolioForm],
  );

  const load = async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    const data = (await res.json()) as SiteContent;
    setContent(data);
    onContentChange?.(data);
    const firstId = sortCategories(data.portfolioCategories || [])[0]?.id || "";
    setPortfolioForm((prev) => (prev.categoryId ? prev : emptyPortfolio(firstId)));
  };

  useEffect(() => {
    load();
  }, []);

  const refreshMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const applyContent = (next: SiteContent) => {
    setContent(next);
    onContentChange?.(next);
  };

  const addCategoryTab = async () => {
    const name = newTabName.trim();
    if (!name) {
      refreshMessage("نام تب را بنویسید.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "portfolio-category", name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      const firstId = sortCategories(data.content.portfolioCategories || [])[0]?.id || "";
      setPortfolioForm((v) => ({ ...v, categoryId: v.categoryId || firstId }));
      setNewTabName("");
      refreshMessage("تب اضافه شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const saveCategoryTab = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "portfolio-category", id, name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      refreshMessage("تب ذخیره شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const removeCategoryTab = async (id: string) => {
    if (!confirm("این تب حذف شود؟ فقط وقتی خالی باشد ممکن است.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "portfolio-category", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      refreshMessage("تب حذف شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const savePortfolioDraft = async () => {
    const needsVideo = portfolioForm.mediaKind === "video";
    if (!portfolioForm.categoryId) {
      refreshMessage("ابتدا یک تب/دسته بسازید.");
      return;
    }
    if (
      !portfolioForm.title.trim() ||
      !portfolioForm.image.trim() ||
      (needsVideo && !portfolioForm.videoSrc.trim())
    ) {
      refreshMessage("عنوان و کاور الزامی است؛ برای ویدیو لینک/فایل ویدیو هم لازم است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "portfolio", ...portfolioForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      setPortfolioForm(emptyPortfolio(portfolioForm.categoryId));
      refreshMessage("کارت ذخیره شد — می‌توانید کارت جدید بسازید.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const startNewPortfolioDraft = () => {
    if (isPortfolioDraftDirty) {
      refreshMessage("ابتدا کارت فعلی را با «ذخیره کارت» ثبت کنید.");
      return;
    }
    const categoryId = portfolioForm.categoryId || categories[0]?.id || "";
    setPortfolioForm(emptyPortfolio(categoryId));
    refreshMessage("فرم کارت جدید آماده است.");
  };

  const addBackstage = async () => {
    const needsVideo = backstageForm.mediaKind === "video";
    if (
      !backstageForm.caption.trim() ||
      (!backstageForm.image && !needsVideo) ||
      (needsVideo && !backstageForm.videoSrc)
    ) {
      refreshMessage("عنوان و مدیا (تصویر یا ویدیو) الزامی است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "backstage", ...backstageForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      setBackstageForm(emptyBackstage);
      refreshMessage("آیتم بک‌استیج اضافه شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const updateItem = async (type: Tab, item: PortfolioItem | BackstageItem) => {
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...item }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ذخیره ناموفق بود");
      applyContent(data.content);
      refreshMessage("ذخیره شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (type: Tab, id: number) => {
    if (!confirm("حذف شود؟")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/content/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      applyContent(data.content);
      refreshMessage("حذف شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const patchPortfolio = (id: number, patch: Partial<PortfolioItem>) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        portfolio: prev.portfolio.map((p) => {
          if (p.id !== id) return p;
          const merged = { ...p, ...patch };
          if (patch.categoryId) {
            const cat = categories.find((c) => c.id === patch.categoryId);
            if (cat) merged.category = cat.name;
          }
          return merged;
        }),
      };
      onContentChange?.(next);
      return next;
    });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!content) {
    return <div className={embedded ? "dash-loading" : "admin-page"}>در حال بارگذاری...</div>;
  }

  const body = (
    <>
      {!embedded && (
        <header className="admin-header">
          <div>
            <h1>پنل مدیریت محتوا</h1>
            <p>نمونه کارها و بک‌استیج را بدون کدنویسی مدیریت کنید.</p>
          </div>
          <div className="admin-actions">
            <Link href="/" className="btn-outline">
              مشاهده سایت
            </Link>
            <button type="button" className="btn-primary" onClick={logout}>
              خروج
            </button>
          </div>
        </header>
      )}

      {embedded && !sectionOnly && (
        <div className="dash-section-head">
          <h2>مدیریت محتوا</h2>
          <p>نمونه کارها و بک‌استیج لندینگ را از اینجا مدیریت کنید.</p>
        </div>
      )}

      {!sectionOnly && (
        <div className="admin-tabs">
          <button
            type="button"
            className={tab === "portfolio" ? "is-active" : ""}
            onClick={() => setTab("portfolio")}
          >
            نمونه کارها
          </button>
          <button
            type="button"
            className={tab === "backstage" ? "is-active" : ""}
            onClick={() => setTab("backstage")}
          >
            بک‌استیج
          </button>
        </div>
      )}

      {message && <div className="admin-toast">{message}</div>}

      {(sectionOnly ?? tab) === "portfolio" ? (
        <section className="admin-section">
          <div className={`admin-form lux-card${compact ? " admin-form--compact" : ""}`}>
            <h2>تب‌های فیلتر سایت</h2>
            <p className="admin-note">هر نامی بخواهید؛ همین‌ها روی لندینگ به‌صورت تب نمایش داده می‌شوند</p>
            <div className="portfolio-tabs-admin">
              <div className="portfolio-tabs-admin-add">
                <input
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  placeholder="مثلاً طراحی لوگو"
                />
                <button type="button" className="btn-primary" disabled={busy} onClick={addCategoryTab}>
                  افزودن تب
                </button>
              </div>
              <div className="portfolio-tabs-admin-list">
                {categories.map((cat) => (
                  <div key={cat.id} className="portfolio-tabs-admin-chip">
                    <input
                      value={cat.name}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolioCategories: prev.portfolioCategories.map((c) =>
                                  c.id === cat.id ? { ...c, name: e.target.value } : c,
                                ),
                              }
                            : prev,
                        )
                      }
                      onBlur={(e) => saveCategoryTab(cat.id, e.target.value)}
                    />
                    <button type="button" disabled={busy} onClick={() => removeCategoryTab(cat.id)} aria-label="حذف">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`admin-form lux-card${compact ? " admin-form--compact" : ""}`}>
            <h2>{isPortfolioDraftDirty ? "کارت در حال ساخت" : "کارت جدید"}</h2>
            <p className="admin-note">
              {compact
                ? "فرم را پر کنید، «ذخیره کارت» بزنید؛ تا ذخیره نشود نمی‌توانید کارت جدید باز کنید."
                : "کاور روی کارت؛ ویدیو/عکس کامل در پنجره جزئیات با ابعاد اصلی"}
            </p>
            <input
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm((v) => ({ ...v, title: e.target.value }))}
              placeholder="عنوان پروژه"
            />
            <select
              value={portfolioForm.categoryId}
              onChange={(e) => setPortfolioForm((v) => ({ ...v, categoryId: e.target.value }))}
              disabled={!categories.length}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <textarea
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm((v) => ({ ...v, description: e.target.value }))}
              placeholder="توضیحات پروژه"
              rows={3}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={portfolioForm.client}
                onChange={(e) => setPortfolioForm((v) => ({ ...v, client: e.target.value }))}
                placeholder="نام کارفرما / برند"
              />
              <input
                value={portfolioForm.year}
                onChange={(e) => setPortfolioForm((v) => ({ ...v, year: e.target.value }))}
                placeholder="سال (مثلاً ۱۴۰۳)"
              />
            </div>
            <MediaItemFields
              uploadKind="portfolio"
              values={{
                image: portfolioForm.image,
                videoSrc: portfolioForm.videoSrc,
                mediaKind: portfolioForm.mediaKind,
                aspectRatio: portfolioForm.aspectRatio,
              }}
              onChange={(patch) => setPortfolioForm((v) => ({ ...v, ...patch }))}
            />
            <div className="admin-item-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !categories.length || !isPortfolioDraftDirty}
                onClick={savePortfolioDraft}
              >
                ذخیره کارت
              </button>
              <button
                type="button"
                className="btn-outline"
                disabled={busy || !categories.length || isPortfolioDraftDirty}
                onClick={startNewPortfolioDraft}
              >
                افزودن کارت جدید
              </button>
            </div>
          </div>

          <div className={`admin-list${compact ? " admin-list--compact" : ""}`}>
            {content.portfolio.map((item, index) =>
              compact ? (
                <LandingItemCard
                  key={item.id}
                  index={index + 1}
                  title={item.title}
                  subtitle={item.category}
                  previewSrc={
                    resolveMediaKind(item) === "video" && item.videoSrc
                      ? item.videoSrc
                      : item.image
                  }
                  previewKind={resolveMediaKind(item) === "video" ? "video" : "image"}
                  posterSrc={item.image}
                  onRemove={() => removeItem("portfolio", item.id)}
                >
                  <input
                    value={item.title}
                    onChange={(e) => patchPortfolio(item.id, { title: e.target.value })}
                    placeholder="عنوان"
                  />
                  <select
                    value={item.categoryId}
                    onChange={(e) => patchPortfolio(item.id, { categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <MediaItemFields
                    compact
                    uploadKind="portfolio"
                    values={{
                      image: item.image,
                      videoSrc: item.videoSrc,
                      mediaKind: item.mediaKind,
                      aspectRatio: item.aspectRatio,
                    }}
                    onChange={(patch) => patchPortfolio(item.id, patch)}
                  />
                  <div className="admin-item-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => updateItem("portfolio", item)}
                    >
                      ذخیره
                    </button>
                  </div>
                </LandingItemCard>
              ) : (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    {resolveMediaKind(item) === "video" && item.videoSrc ? (
                      needsIframeVideoEmbed(item.videoSrc) ? (
                        item.image || toGoogleDriveThumbnailUrl(item.videoSrc) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image || toGoogleDriveThumbnailUrl(item.videoSrc) || undefined}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-black/40 text-xs text-white/80">
                            ویدیو
                          </div>
                        )
                      ) : (
                        <video
                          src={toPlayableVideoUrl(item.videoSrc)}
                          poster={item.image}
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <ContentImage src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="admin-item-body">
                    <input
                      value={item.title}
                      onChange={(e) => patchPortfolio(item.id, { title: e.target.value })}
                    />
                    <select
                      value={item.categoryId}
                      onChange={(e) => patchPortfolio(item.id, { categoryId: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={item.description || ""}
                      rows={2}
                      placeholder="توضیحات"
                      onChange={(e) => patchPortfolio(item.id, { description: e.target.value })}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={item.client || ""}
                        placeholder="کارفرما"
                        onChange={(e) => patchPortfolio(item.id, { client: e.target.value })}
                      />
                      <input
                        value={item.year || ""}
                        placeholder="سال"
                        onChange={(e) => patchPortfolio(item.id, { year: e.target.value })}
                      />
                    </div>
                    <MediaItemFields
                      compact
                      uploadKind="portfolio"
                      values={{
                        image: item.image,
                        videoSrc: item.videoSrc,
                        mediaKind: item.mediaKind,
                        aspectRatio: item.aspectRatio,
                      }}
                      onChange={(patch) => patchPortfolio(item.id, patch)}
                    />
                    <div className="admin-item-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => updateItem("portfolio", item)}
                      >
                        ذخیره
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={busy}
                        onClick={() => removeItem("portfolio", item.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      ) : (
        <section className="admin-section">
          <div className={`admin-form lux-card${compact ? " admin-form--compact" : ""}`}>
            <h2>افزودن بک‌استیج</h2>
            {!compact && <p className="admin-note">تصویر یا ویدیو — نسبت قابل تنظیم</p>}
            <input
              value={backstageForm.caption}
              onChange={(e) => setBackstageForm((v) => ({ ...v, caption: e.target.value }))}
              placeholder="عنوان کوتاه"
            />
            <MediaItemFields
              uploadKind="backstage"
              values={{
                image: backstageForm.image,
                videoSrc: backstageForm.videoSrc,
                mediaKind: backstageForm.mediaKind,
                aspectRatio: backstageForm.aspectRatio,
              }}
              onChange={(patch) => setBackstageForm((v) => ({ ...v, ...patch }))}
            />
            <button type="button" className="btn-primary" disabled={busy} onClick={addBackstage}>
              افزودن کارت
            </button>
          </div>

          <div className={`admin-list${compact ? " admin-list--compact" : ""}`}>
            {content.backstage.map((item, index) =>
              compact ? (
                <LandingItemCard
                  key={item.id}
                  index={index + 1}
                  title={item.caption}
                  subtitle={resolveMediaKind(item) === "video" ? "ویدیو" : "تصویر"}
                  previewSrc={
                    resolveMediaKind(item) === "video" && item.videoSrc ? item.videoSrc : item.image
                  }
                  previewKind={resolveMediaKind(item) === "video" ? "video" : "image"}
                  posterSrc={item.image}
                  onRemove={() => removeItem("backstage", item.id)}
                >
                  <input
                    value={item.caption}
                    onChange={(e) =>
                      setContent((prev) =>
                        prev
                          ? {
                              ...prev,
                              backstage: prev.backstage.map((b) =>
                                b.id === item.id ? { ...b, caption: e.target.value } : b,
                              ),
                            }
                          : prev,
                      )
                    }
                    placeholder="عنوان"
                  />
                  <MediaItemFields
                    compact
                    uploadKind="backstage"
                    values={{
                      image: item.image,
                      videoSrc: item.videoSrc,
                      mediaKind: item.mediaKind,
                      aspectRatio: item.aspectRatio,
                    }}
                    onChange={(patch) =>
                      setContent((prev) =>
                        prev
                          ? {
                              ...prev,
                              backstage: prev.backstage.map((b) =>
                                b.id === item.id ? { ...b, ...patch } : b,
                              ),
                            }
                          : prev,
                      )
                    }
                  />
                  <div className="admin-item-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => updateItem("backstage", item)}
                    >
                      ذخیره
                    </button>
                  </div>
                </LandingItemCard>
              ) : (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    {resolveMediaKind(item) === "video" && item.videoSrc ? (
                      needsIframeVideoEmbed(item.videoSrc) ? (
                        item.image || toGoogleDriveThumbnailUrl(item.videoSrc) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image || toGoogleDriveThumbnailUrl(item.videoSrc) || undefined}
                            alt={item.caption}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-black/40 text-xs text-white/80">
                            ویدیو لینک
                          </div>
                        )
                      ) : (
                        <video
                          src={toPlayableVideoUrl(item.videoSrc)}
                          poster={item.image}
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <ContentImage src={item.image} alt={item.caption} fill className="object-cover" />
                    )}
                  </div>
                  <div className="admin-item-body">
                    <input
                      value={item.caption}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                backstage: prev.backstage.map((b) =>
                                  b.id === item.id ? { ...b, caption: e.target.value } : b,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <MediaItemFields
                      compact
                      uploadKind="backstage"
                      values={{
                        image: item.image,
                        videoSrc: item.videoSrc,
                        mediaKind: item.mediaKind,
                        aspectRatio: item.aspectRatio,
                      }}
                      onChange={(patch) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                backstage: prev.backstage.map((b) =>
                                  b.id === item.id ? { ...b, ...patch } : b,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <div className="admin-item-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => updateItem("backstage", item)}
                      >
                        ذخیره
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={busy}
                        onClick={() => removeItem("backstage", item.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}
    </>
  );

  if (embedded) {
    return <div className={`admin-embedded${compact ? " admin-embedded--compact" : ""}`}>{body}</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-shell">{body}</div>
    </div>
  );
}
