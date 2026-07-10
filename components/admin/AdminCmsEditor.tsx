"use client";

import { useEffect, useState } from "react";
import type { LandingContent, SiteContent, SiteInfo, ThemeSettings } from "@/lib/content-store";

export default function AdminCmsEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [section, setSection] = useState<"landing" | "pages" | "site" | "theme">("landing");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (res.ok) setContent(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (patch: Partial<SiteContent>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/content/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا");
      setContent(data.content);
      setToast("ذخیره شد و روی سایت اعمال می‌شود.");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const uploadHero = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "hero");
    setBusy(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
      const isVideo = file.type.startsWith("video/");
      await save({
        landing: {
          ...(content!.landing as LandingContent),
          heroMediaUrl: data.url,
          heroMediaType: isVideo ? "video" : "image",
        },
      });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  if (!content) return <p className="text-muted">در حال بارگذاری محتوا...</p>;

  const landing = content.landing;
  const pages = content.pages;
  const site = content.site;
  const theme = content.theme;

  return (
    <section>
      <div className="dash-section-head">
        <h2>مدیریت صفحات و ظاهر</h2>
        <p>تغییرات بلافاصله روی لندینگ و صفحات عمومی اعمال می‌شود</p>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["landing", "لندینگ / هیرو"],
            ["pages", "صفحات"],
            ["site", "اطلاعات سایت"],
            ["theme", "ظاهر"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`filter-chip ${section === id ? "is-active" : ""}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "landing" && (
        <div className="admin-form lux-card space-y-3">
          <h3 className="font-bold">هیرو و سکشن‌های لندینگ</h3>
          {(
            [
              ["heroBadge", "بج هیرو"],
              ["heroTitle", "تیتر (قبل از هایلایت)"],
              ["heroTitleHighlight", "کلمه هایلایت"],
              ["heroDescription", "توضیح هیرو"],
              ["heroPrimaryCta", "متن دکمه اصلی"],
              ["heroPrimaryHref", "لینک دکمه اصلی"],
              ["heroSecondaryCta", "متن دکمه دوم"],
              ["heroSecondaryHref", "لینک دکمه دوم"],
              ["aboutLabel", "برچسب درباره"],
              ["aboutTitle", "تیتر درباره"],
              ["aboutText1", "متن ۱ درباره"],
              ["aboutText2", "متن ۲ درباره"],
              ["servicesLabel", "برچسب خدمات"],
              ["servicesTitle", "تیتر خدمات"],
              ["processLabel", "برچسب فرآیند"],
              ["processTitle", "تیتر فرآیند"],
            ] as Array<[keyof LandingContent, string]>
          ).map(([key, label]) => (
            <label key={key} className="contact-field">
              <span>{label}</span>
              {String(landing[key]).length > 80 ? (
                <textarea
                  rows={3}
                  value={String(landing[key] || "")}
                  onChange={(e) =>
                    setContent({ ...content, landing: { ...landing, [key]: e.target.value } })
                  }
                />
              ) : (
                <input
                  value={String(landing[key] || "")}
                  onChange={(e) =>
                    setContent({ ...content, landing: { ...landing, [key]: e.target.value } })
                  }
                />
              )}
            </label>
          ))}

          <label className="contact-field">
            <span>ویدیو / عکس هیرو</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadHero(file);
              }}
            />
            <small className="text-muted">فعلی: {landing.heroMediaUrl}</small>
          </label>

          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => save({ landing })}
          >
            ذخیره لندینگ
          </button>
        </div>
      )}

      {section === "pages" && (
        <div className="admin-form lux-card space-y-4">
          <h3 className="font-bold">صفحات درباره / تماس / فرآیند / نمونه کارها</h3>
          {(["about", "contact", "process", "portfolio"] as const).map((pageKey) => (
            <div key={pageKey} className="rounded-xl border border-black/10 p-3">
              <strong className="mb-2 block">{pageKey}</strong>
              {(["label", "title", "intro"] as const).map((field) => (
                <label key={field} className="contact-field">
                  <span>{field}</span>
                  {field === "intro" ? (
                    <textarea
                      rows={3}
                      value={(pages[pageKey] as { intro: string })[field]}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          pages: {
                            ...pages,
                            [pageKey]: { ...pages[pageKey], [field]: e.target.value },
                          },
                        })
                      }
                    />
                  ) : (
                    <input
                      value={(pages[pageKey] as Record<string, string>)[field]}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          pages: {
                            ...pages,
                            [pageKey]: { ...pages[pageKey], [field]: e.target.value },
                          },
                        })
                      }
                    />
                  )}
                </label>
              ))}
              {pageKey === "contact" && (
                <label className="contact-field">
                  <span>ساعات کاری</span>
                  <input
                    value={pages.contact.hours}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        pages: { ...pages, contact: { ...pages.contact, hours: e.target.value } },
                      })
                    }
                  />
                </label>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => save({ pages })}
          >
            ذخیره صفحات
          </button>
        </div>
      )}

      {section === "site" && (
        <div className="admin-form lux-card space-y-3">
          <h3 className="font-bold">اطلاعات سایت</h3>
          {(
            [
              ["title", "عنوان سایت"],
              ["description", "توضیح کوتاه"],
              ["phone", "تلفن"],
              ["email", "ایمیل"],
              ["address", "آدرس"],
              ["footerText", "متن فوتر"],
            ] as Array<[keyof SiteInfo, string]>
          ).map(([key, label]) => (
            <label key={key} className="contact-field">
              <span>{label}</span>
              <input
                value={String(site[key] || "")}
                onChange={(e) =>
                  setContent({ ...content, site: { ...site, [key]: e.target.value } })
                }
              />
            </label>
          ))}
          <button type="button" className="btn-primary" disabled={busy} onClick={() => save({ site })}>
            ذخیره اطلاعات سایت
          </button>
        </div>
      )}

      {section === "theme" && (
        <div className="admin-form lux-card space-y-3">
          <h3 className="font-bold">ظاهر محدود</h3>
          <label className="contact-field">
            <span>رنگ اصلی برند</span>
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) =>
                setContent({ ...content, theme: { ...theme, primaryColor: e.target.value } })
              }
            />
          </label>
          <label className="contact-field">
            <span>اندازه تیترها</span>
            <select
              value={theme.headingScale}
              onChange={(e) =>
                setContent({
                  ...content,
                  theme: { ...theme, headingScale: e.target.value as ThemeSettings["headingScale"] },
                })
              }
            >
              <option value="sm">کوچک</option>
              <option value="md">متوسط</option>
              <option value="lg">بزرگ</option>
            </select>
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => save({ theme })}
          >
            ذخیره ظاهر
          </button>
        </div>
      )}
    </section>
  );
}
