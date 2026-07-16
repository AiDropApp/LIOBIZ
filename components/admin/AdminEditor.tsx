"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentImage from "@/components/ContentImage";
import CmsMedia from "@/components/CmsMedia";
import MediaItemFields from "@/components/admin/landing/MediaItemFields";
import LandingItemCard from "@/components/admin/landing/LandingItemCard";
import { PORTFOLIO_FILTERS } from "@/lib/constants";
import { resolveMediaKind, type MediaAspect, type MediaKind } from "@/lib/media-types";
import type { BackstageItem, PortfolioItem, SiteContent } from "@/lib/content-store";

type Tab = "portfolio" | "backstage";

type PortfolioForm = {
  title: string;
  category: string;
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

const emptyPortfolio: PortfolioForm = {
  title: "",
  category: "برندینگ",
  image: "",
  videoSrc: "",
  mediaKind: "image",
  aspectRatio: "portrait",
  description: "",
  client: "",
  year: "",
};

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
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolio);
  const [backstageForm, setBackstageForm] = useState(emptyBackstage);

  const load = async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    const data = (await res.json()) as SiteContent;
    setContent(data);
    onContentChange?.(data);
  };

  useEffect(() => {
    load();
  }, []);

  const refreshMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const addPortfolio = async () => {
    const needsVideo = portfolioForm.mediaKind === "video";
    if (!portfolioForm.title.trim() || (!portfolioForm.image && !needsVideo) || (needsVideo && !portfolioForm.videoSrc)) {
      refreshMessage("عنوان و مدia (تصویر یا ویدیو) الزامی است.");
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
      setContent(data.content);
      onContentChange?.(data.content);
      setPortfolioForm(emptyPortfolio);
      refreshMessage("نمونه کار اضافه شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const addBackstage = async () => {
    const needsVideo = backstageForm.mediaKind === "video";
    if (!backstageForm.caption.trim() || (!backstageForm.image && !needsVideo) || (needsVideo && !backstageForm.videoSrc)) {
      refreshMessage("عنوان و مدia (تصویر یا ویدیو) الزامی است.");
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
      setContent(data.content);
      onContentChange?.(data.content);
      setBackstageForm(emptyBackstage);
      refreshMessage("آیتم بک‌استیج اضافه شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const persistItem = async (type: Tab, item: PortfolioItem | BackstageItem) => {
    const res = await fetch("/api/content/manage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...item }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "ذخیره ناموفق بود");
    setContent(data.content as SiteContent);
    onContentChange?.(data.content as SiteContent);
    return data.content as SiteContent;
  };

  const updateItem = async (type: Tab, item: PortfolioItem | BackstageItem) => {
    setBusy(true);
    try {
      await persistItem(type, item);
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
      setContent(data.content);
      onContentChange?.(data.content);
      refreshMessage("حذف شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
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
        <button type="button" className={tab === "portfolio" ? "is-active" : ""} onClick={() => setTab("portfolio")}>
          نمونه کارها
        </button>
        <button type="button" className={tab === "backstage" ? "is-active" : ""} onClick={() => setTab("backstage")}>
          بک‌استیج
        </button>
      </div>
      )}

        {message && <div className="admin-toast">{message}</div>}

        {(sectionOnly ?? tab) === "portfolio" ? (
          <section className="admin-section">
            <div className={`admin-form lux-card${compact ? " admin-form--compact" : ""}`}>
              <h2>افزودن نمونه کار</h2>
              {!compact && <p className="admin-note">تصویر یا ویدیو — نسبت عمودی/افقی/مربعی قابل تنظیم است</p>}
              <input
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm((v) => ({ ...v, title: e.target.value }))}
                placeholder="عنوان پروژه"
              />
              <select
                value={portfolioForm.category}
                onChange={(e) => setPortfolioForm((v) => ({ ...v, category: e.target.value }))}
              >
                {PORTFOLIO_FILTERS.filter((f) => f !== "همه").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
              <button type="button" className="btn-primary" disabled={busy} onClick={addPortfolio}>
                افزودن کارت
              </button>
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
                    onRemove={() => removeItem("portfolio", item.id)}
                  >
                    <input
                      value={item.title}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, title: e.target.value } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                      placeholder="عنوان"
                    />
                    <select
                      value={item.category}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, category: e.target.value } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    >
                      {PORTFOLIO_FILTERS.filter((f) => f !== "همه").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
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
                      onChange={(patch) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, ...patch } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <div className="admin-item-actions">
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => updateItem("portfolio", item)}>
                        ذخیره
                      </button>
                    </div>
                  </LandingItemCard>
                ) : (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    {resolveMediaKind(item) === "video" && item.videoSrc ? (
                      <video src={item.videoSrc} poster={item.image} muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <ContentImage src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="admin-item-body">
                    <input
                      value={item.title}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, title: e.target.value } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <select
                      value={item.category}
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, category: e.target.value } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    >
                      {PORTFOLIO_FILTERS.filter((f) => f !== "همه").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={item.description || ""}
                      rows={2}
                      placeholder="توضیحات"
                      onChange={(e) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, description: e.target.value } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={item.client || ""}
                        placeholder="کارفرما"
                        onChange={(e) =>
                          setContent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  portfolio: prev.portfolio.map((p) =>
                                    p.id === item.id ? { ...p, client: e.target.value } : p,
                                  ),
                                }
                              : prev,
                          )
                        }
                      />
                      <input
                        value={item.year || ""}
                        placeholder="سال"
                        onChange={(e) =>
                          setContent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  portfolio: prev.portfolio.map((p) =>
                                    p.id === item.id ? { ...p, year: e.target.value } : p,
                                  ),
                                }
                              : prev,
                          )
                        }
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
                      onChange={(patch) =>
                        setContent((prev) =>
                          prev
                            ? {
                                ...prev,
                                portfolio: prev.portfolio.map((p) =>
                                  p.id === item.id ? { ...p, ...patch } : p,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <div className="admin-item-actions">
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => updateItem("portfolio", item)}>
                        ذخیره
                      </button>
                      <button type="button" className="btn-outline" disabled={busy} onClick={() => removeItem("portfolio", item.id)}>
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
                      resolveMediaKind(item) === "video" && item.videoSrc
                        ? item.videoSrc
                        : item.image
                    }
                    previewKind={resolveMediaKind(item) === "video" ? "video" : "image"}
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
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => updateItem("backstage", item)}>
                        ذخیره
                      </button>
                    </div>
                  </LandingItemCard>
                ) : (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    {resolveMediaKind(item) === "video" && item.videoSrc ? (
                      <video src={item.videoSrc} poster={item.image} muted playsInline className="h-full w-full object-cover" />
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
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => updateItem("backstage", item)}>
                        ذخیره
                      </button>
                      <button type="button" className="btn-outline" disabled={busy} onClick={() => removeItem("backstage", item.id)}>
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
