"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentImage from "@/components/ContentImage";
import { PORTFOLIO_FILTERS } from "@/lib/constants";
import type { BackstageItem, PortfolioItem, SiteContent } from "@/lib/content-store";

type Tab = "portfolio" | "backstage";

const emptyPortfolio = {
  title: "",
  category: "برندینگ",
  image: "",
};

const emptyBackstage = {
  caption: "",
  image: "",
};

export default function AdminEditor({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("portfolio");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolio);
  const [backstageForm, setBackstageForm] = useState(emptyBackstage);

  const load = async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    const data = (await res.json()) as SiteContent;
    setContent(data);
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File, kind: Tab) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "آپلود ناموفق بود");
    return data.url as string;
  };

  const refreshMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const addPortfolio = async () => {
    if (!portfolioForm.title.trim() || !portfolioForm.image) {
      refreshMessage("عنوان و تصویر نمونه کار الزامی است.");
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
      setPortfolioForm(emptyPortfolio);
      refreshMessage("نمونه کار اضافه شد.");
    } catch (error) {
      refreshMessage(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const addBackstage = async () => {
    if (!backstageForm.caption.trim() || !backstageForm.image) {
      refreshMessage("عنوان و تصویر بک‌استیج الزامی است.");
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

      {embedded && (
        <div className="dash-section-head">
          <h2>مدیریت محتوا</h2>
          <p>نمونه کارها و بک‌استیج لندینگ را از اینجا مدیریت کنید.</p>
        </div>
      )}

      <div className="admin-tabs">
        <button type="button" className={tab === "portfolio" ? "is-active" : ""} onClick={() => setTab("portfolio")}>
          نمونه کارها
        </button>
        <button type="button" className={tab === "backstage" ? "is-active" : ""} onClick={() => setTab("backstage")}>
          بک‌استیج
        </button>
      </div>

        {message && <div className="admin-toast">{message}</div>}

        {tab === "portfolio" ? (
          <section className="admin-section">
            <div className="admin-form lux-card">
              <h2>افزودن نمونه کار</h2>
              <p className="admin-note">قالب تصویر: عمودی حدود ۴:۵ — حداکثر ۴ مگابایت</p>
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
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    const url = await upload(file, "portfolio");
                    setPortfolioForm((v) => ({ ...v, image: url }));
                    refreshMessage("تصویر آپلود شد.");
                  } catch (error) {
                    refreshMessage(error instanceof Error ? error.message : "خطا");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {portfolioForm.image && (
                <div className="admin-preview">
                  <ContentImage src={portfolioForm.image} alt="" width={120} height={150} className="object-cover" />
                </div>
              )}
              <button type="button" className="btn-primary" disabled={busy} onClick={addPortfolio}>
                افزودن کارت
              </button>
            </div>

            <div className="admin-list">
              {content.portfolio.map((item) => (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    <ContentImage src={item.image} alt={item.title} fill className="object-cover" />
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusy(true);
                        try {
                          const url = await upload(file, "portfolio");
                          const nextItem = { ...item, image: url };
                          setContent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  portfolio: prev.portfolio.map((p) =>
                                    p.id === item.id ? nextItem : p,
                                  ),
                                }
                              : prev,
                          );
                          await persistItem("portfolio", nextItem);
                          refreshMessage("تصویر ذخیره شد.");
                        } catch (error) {
                          refreshMessage(error instanceof Error ? error.message : "خطا");
                        } finally {
                          setBusy(false);
                        }
                      }}
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
              ))}
            </div>
          </section>
        ) : (
          <section className="admin-section">
            <div className="admin-form lux-card">
              <h2>افزودن بک‌استیج</h2>
              <p className="admin-note">قالب تصویر: عمودی حدود ۳:۴ — حداکثر ۴ مگابایت</p>
              <input
                value={backstageForm.caption}
                onChange={(e) => setBackstageForm((v) => ({ ...v, caption: e.target.value }))}
                placeholder="عنوان کوتاه"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    const url = await upload(file, "backstage");
                    setBackstageForm((v) => ({ ...v, image: url }));
                    refreshMessage("تصویر آپلود شد.");
                  } catch (error) {
                    refreshMessage(error instanceof Error ? error.message : "خطا");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {backstageForm.image && (
                <div className="admin-preview">
                  <ContentImage src={backstageForm.image} alt="" width={120} height={160} className="object-cover" />
                </div>
              )}
              <button type="button" className="btn-primary" disabled={busy} onClick={addBackstage}>
                افزودن کارت
              </button>
            </div>

            <div className="admin-list">
              {content.backstage.map((item) => (
                <article key={item.id} className="admin-item lux-card">
                  <div className="admin-item-media">
                    <ContentImage src={item.image} alt={item.caption} fill className="object-cover" />
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusy(true);
                        try {
                          const url = await upload(file, "backstage");
                          const nextItem = { ...item, image: url };
                          setContent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  backstage: prev.backstage.map((b) =>
                                    b.id === item.id ? nextItem : b,
                                  ),
                                }
                              : prev,
                          );
                          await persistItem("backstage", nextItem);
                          refreshMessage("تصویر ذخیره شد.");
                        } catch (error) {
                          refreshMessage(error instanceof Error ? error.message : "خطا");
                        } finally {
                          setBusy(false);
                        }
                      }}
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
              ))}
            </div>
          </section>
        )}
    </>
  );

  if (embedded) return <div className="admin-embedded">{body}</div>;

  return (
    <div className="admin-page">
      <div className="admin-shell">{body}</div>
    </div>
  );
}
