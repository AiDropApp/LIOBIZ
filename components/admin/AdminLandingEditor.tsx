"use client";

import { useCallback, useEffect, useState } from "react";
import type { SiteContent, ThemeSettings } from "@/lib/content-store";
import { isVideoUrl } from "@/lib/media-types";
import LandingSectionPanel from "@/components/admin/landing/LandingSectionPanel";
import MediaUrlField from "@/components/admin/landing/MediaUrlField";

const SECTIONS = [
  { id: "site-brand", emoji: "🎨", title: "برند و ظاهر", subtitle: "لوگو، رنگ، اندازه تیتر" },
  { id: "redirects", emoji: "↪️", title: "ریدایرکت", subtitle: "ریدایرکت ۳۰۱" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="contact-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export default function AdminLandingEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [open, setOpen] = useState<SectionId>("site-brand");
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
      flash("ذخیره شد.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  if (!content) {
    return <p className="text-muted p-4">در حال بارگذاری…</p>;
  }

  const { site, theme, landing } = content;

  return (
    <section className="landing-admin">
      <div className="dash-section-head">
        <h2>تنظیمات سایت</h2>
        <p className="mb-3">
          ویرایش متن، تصویر و سکشن‌ها روی خود صفحات انجام می‌شود: هر صفحه → «✏️ ویرایش این صفحه» در پایین.
        </p>
        <p className="text-sm text-muted">
          این بخش فقط برای لوگو، رنگ تم، SEO و ریدایرکت‌های ۳۰۱ است. نمونه‌کار و بک‌استیج از تب «رسانه»، بلاگ از تب «بلاگ».
        </p>
        <a href="/" target="_blank" rel="noreferrer" className="btn-outline mt-3 inline-flex text-sm">
          پیش‌نمایش سایت ↗
        </a>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}

      <nav className="landing-section-nav" aria-label="تنظیمات سایت">
        <div className="landing-section-nav-track">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`landing-nav-chip${open === s.id ? " is-active" : ""}`}
              onClick={() => setOpen(s.id)}
            >
              <span className="landing-nav-emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="landing-nav-label">{s.title}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="landing-sections-stack">
        {open === "site-brand" && (
          <LandingSectionPanel
            id="site-brand"
            emoji="🎨"
            title="برند و ظاهر"
            subtitle="لوگو، رنگ، اندازه تیتر"
            open
            onToggle={() => undefined}
            onSave={() =>
              save({
                site,
                theme,
                landing: {
                  ...landing,
                  heroMediaType: isVideoUrl(landing.heroMediaUrl) ? "video" : "image",
                },
              })
            }
            saving={busy}
          >
            <Field label="نام کوتاه برند" value={site.name} onChange={(v) => setContent({ ...content, site: { ...site, name: v } })} />
            <Field label="عنوان SEO (title)" value={site.title} onChange={(v) => setContent({ ...content, site: { ...site, title: v } })} />
            <Field
              label="توضیح SEO"
              value={site.description}
              onChange={(v) => setContent({ ...content, site: { ...site, description: v } })}
              multiline
            />
            <MediaUrlField
              label="ویدیو / تصویر پس‌زمینه هیرو"
              value={landing.heroMediaUrl}
              onChange={(url) =>
                setContent({
                  ...content,
                  landing: {
                    ...landing,
                    heroMediaUrl: url,
                    heroMediaType: isVideoUrl(url) ? "video" : "image",
                  },
                })
              }
              uploadKind="hero"
              accept="image/*,video/*"
              hint="لینk مستقیم، یوتیوب، یا آپلود — روی صفحه اصلی در حالت «ویرایش صفحه» هم از کتابخانه قابل تغییر است"
            />
            <MediaUrlField
              label="لوگو سایت"
              value={site.logoUrl}
              onChange={(url) => setContent({ ...content, site: { ...site, logoUrl: url } })}
              uploadKind="hero"
              accept="image/*"
              hint="در هدر و فوتر نمایش داده می‌شود"
            />
            <label className="contact-field">
              <span>رنگ اصلی برند</span>
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => setContent({ ...content, theme: { ...theme, primaryColor: e.target.value } })}
              />
            </label>
            <label className="contact-field">
              <span>اندازه تیترهای سکشن</span>
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
          </LandingSectionPanel>
        )}

        {open === "redirects" && (
          <LandingSectionPanel
            id="redirects"
            emoji="↪️"
            title="ریدایرکت ۳۰۱"
            subtitle="آدرس‌های قدیمی → جدید"
            open
            onToggle={() => undefined}
            onSave={() => save({ redirects: content.redirects || [] })}
            saving={busy}
          >
            <p className="text-sm text-muted">پس از ذخیره، deploy/rebuild لازم است.</p>
            {(content.redirects || []).map((rule, index) => (
              <div key={`${rule.from}-${index}`} className="landing-item-card grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Field
                  label="از"
                  value={rule.from}
                  onChange={(v) => {
                    const redirects = [...(content.redirects || [])];
                    redirects[index] = { ...redirects[index], from: v };
                    setContent({ ...content, redirects });
                  }}
                />
                <Field
                  label="به"
                  value={rule.to}
                  onChange={(v) => {
                    const redirects = [...(content.redirects || [])];
                    redirects[index] = { ...redirects[index], to: v };
                    setContent({ ...content, redirects });
                  }}
                />
                <button
                  type="button"
                  className="btn-outline self-end"
                  onClick={() =>
                    setContent({
                      ...content,
                      redirects: (content.redirects || []).filter((_, i) => i !== index),
                    })
                  }
                >
                  حذف
                </button>
              </div>
            ))}
            <button
              type="button"
              className="landing-add-btn"
              onClick={() =>
                setContent({
                  ...content,
                  redirects: [...(content.redirects || []), { from: "", to: "", permanent: true }],
                })
              }
            >
              + افزودن ریدایرکت
            </button>
          </LandingSectionPanel>
        )}
      </div>
    </section>
  );
}
