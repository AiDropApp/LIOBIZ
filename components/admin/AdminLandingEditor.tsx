"use client";

import { useCallback, useEffect, useState } from "react";
import type { LandingContent } from "@/lib/cms-defaults";
import type { SiteContent } from "@/lib/content-store";
import AdminEditor from "@/components/admin/AdminEditor";
import LandingSectionPanel from "@/components/admin/landing/LandingSectionPanel";
import MediaUrlField from "@/components/admin/landing/MediaUrlField";
import MediaItemFields from "@/components/admin/landing/MediaItemFields";
import LandingItemCard from "@/components/admin/landing/LandingItemCard";
import { normalizeMediaFields, resolveMediaKind } from "@/lib/media-types";
import type { CreativePartnerItem, PartnerItem, TestimonialItem } from "@/lib/landing-defaults";

const SECTIONS = [
  { id: "hero", emoji: "🏠", title: "هیرو", subtitle: "تیتر، دکمه‌ها، ویدیو/عکس پس‌زمینه" },
  { id: "hero-stats", emoji: "📊", title: "آمار هیرو", subtitle: "اعداد و برچسب‌های زیر هیرو" },
  { id: "about", emoji: "ℹ️", title: "درباره لیوبیز", subtitle: "متن‌ها و دو تصویر" },
  { id: "services", emoji: "🛠️", title: "خدمات", subtitle: "عنوان سکشن و لیست خدمات" },
  { id: "portfolio", emoji: "🎨", title: "نمونه کارها", subtitle: "عنوان + مدیریت آیتم‌ها" },
  { id: "process", emoji: "🔄", title: "فرایند همکاری", subtitle: "مراحل و عناوین" },
  { id: "plans", emoji: "💰", title: "پلن‌ها", subtitle: "سه پلن همکاری" },
  { id: "backstage", emoji: "📸", title: "بک‌استیج", subtitle: "گالری، متن و آمار تیم" },
  { id: "partners-creative", emoji: "🎬", title: "همکاران خلاق", subtitle: "پارتنرها با ویدیو/عکس" },
  { id: "faq", emoji: "❓", title: "FAQ", subtitle: "سوالات متداول" },
  { id: "testimonials", emoji: "💬", title: "نظرات مشتریان", subtitle: "گواهی مشتریان" },
  { id: "partners", emoji: "🤝", title: "برندهای همکار", subtitle: "لوگو + لینk" },
  { id: "site-brand", emoji: "🏷️", title: "برند سایت", subtitle: "نام، لوگو، رنگ اصلی" },
  { id: "footer", emoji: "📞", title: "فوتر", subtitle: "تماس، CTA، لینک‌ها" },
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

function emptyCreativePartner(): CreativePartnerItem {
  return normalizeMediaFields({
    id: `partner-${Date.now()}`,
    name: "",
    role: "",
    showcase: "",
    bio: "",
    quote: "",
    avatarSrc: "",
    videoSrc: "",
    mediaKind: "image",
    aspectRatio: "landscape",
  });
}

function emptyTestimonial(): TestimonialItem {
  return { name: "", role: "", quote: "" };
}

function emptyPartner(): PartnerItem {
  return { name: "", logo: "", href: "" };
}

export default function AdminLandingEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [open, setOpen] = useState<SectionId>("hero");
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
      flash("ذخیره شد — تغییرات روی سایت اعمال می‌شود.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const patchLanding = (key: keyof LandingContent, value: string) => {
    if (!content) return;
    setContent({ ...content, landing: { ...content.landing, [key]: value } });
  };

  if (!content) {
    return <p className="text-muted p-4">در حال بارگذاری محتوای لندینگ...</p>;
  }

  const { landing, pages, site, plans, faq, testimonials, partners, creativePartners, teamStats, theme } =
    content;

  return (
    <section className="landing-admin">
      <div className="dash-section-head">
        <h2>مدیریت لندینگ</h2>
        <p>هر بخش = یک قسمت از صفحه اصلی. باز کنید، ویرایش کنید، ذخیره کنید.</p>
        <a href="/" target="_blank" rel="noreferrer" className="btn-outline mt-3 inline-flex text-sm">
          پیش‌نمایش سایت ↗
        </a>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}

      <nav className="landing-section-nav" aria-label="بخش‌های لندینگ">
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
        {open === "hero" && (
          <LandingSectionPanel
            id="hero"
            emoji="🏠"
            title="هیرو"
            subtitle="بخش بالای صفحه (#home)"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing })}
            saving={busy}
          >
            <Field label="بج" value={landing.heroBadge} onChange={(v) => patchLanding("heroBadge", v)} />
            <Field label="تیتر (قبل هایلایت)" value={landing.heroTitle} onChange={(v) => patchLanding("heroTitle", v)} />
            <Field label="کلمه هایلایت" value={landing.heroTitleHighlight} onChange={(v) => patchLanding("heroTitleHighlight", v)} />
            <Field label="توضیح" value={landing.heroDescription} onChange={(v) => patchLanding("heroDescription", v)} multiline />
            <Field label="دکمه اصلی" value={landing.heroPrimaryCta} onChange={(v) => patchLanding("heroPrimaryCta", v)} />
            <Field label="لینک دکمه اصلی" value={landing.heroPrimaryHref} onChange={(v) => patchLanding("heroPrimaryHref", v)} />
            <Field label="دکمه دوم" value={landing.heroSecondaryCta} onChange={(v) => patchLanding("heroSecondaryCta", v)} />
            <Field label="لینک دکمه دوم" value={landing.heroSecondaryHref} onChange={(v) => patchLanding("heroSecondaryHref", v)} />
            <MediaUrlField
              label="ویدیو / عکس پس‌زمینه هیرو"
              value={landing.heroMediaUrl}
              onChange={(url) => {
                const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
                setContent({
                  ...content,
                  landing: {
                    ...landing,
                    heroMediaUrl: url,
                    heroMediaType: isVideo ? "video" : "image",
                  },
                });
              }}
              uploadKind="hero"
            />
          </LandingSectionPanel>
        )}

        {open === "hero-stats" && (
          <LandingSectionPanel
            id="hero-stats"
            emoji="📊"
            title="آمار هیرو"
            subtitle="نوار آمار زیر ویدیو"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing: { ...landing, heroStats: landing.heroStats } })}
            saving={busy}
          >
            {landing.heroStats.map((stat, i) => (
              <div key={i} className="landing-item-card">
                <Field
                  label={`مقدار ${i + 1}`}
                  value={stat.value}
                  onChange={(v) => {
                    const heroStats = [...landing.heroStats];
                    heroStats[i] = { ...heroStats[i], value: v };
                    setContent({ ...content, landing: { ...landing, heroStats } });
                  }}
                />
                <Field
                  label="برچسب"
                  value={stat.label}
                  onChange={(v) => {
                    const heroStats = [...landing.heroStats];
                    heroStats[i] = { ...heroStats[i], label: v };
                    setContent({ ...content, landing: { ...landing, heroStats } });
                  }}
                />
              </div>
            ))}
          </LandingSectionPanel>
        )}

        {open === "about" && (
          <LandingSectionPanel
            id="about"
            emoji="ℹ️"
            title="درباره لیوبیز"
            subtitle="سکشن #about-liobiz"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.aboutLabel} onChange={(v) => patchLanding("aboutLabel", v)} />
            <Field label="تیتر" value={landing.aboutTitle} onChange={(v) => patchLanding("aboutTitle", v)} />
            <Field label="متن ۱" value={landing.aboutText1} onChange={(v) => patchLanding("aboutText1", v)} multiline />
            <Field label="متن ۲" value={landing.aboutText2} onChange={(v) => patchLanding("aboutText2", v)} multiline />
            <Field label="بج روی تصویر" value={landing.aboutBadge} onChange={(v) => patchLanding("aboutBadge", v)} />
            <MediaUrlField label="تصویر اصلی" value={landing.aboutImage1} onChange={(v) => patchLanding("aboutImage1", v)} uploadKind="about" accept="image/*" />
            <MediaUrlField label="تصویر شناور" value={landing.aboutImage2} onChange={(v) => patchLanding("aboutImage2", v)} uploadKind="about" accept="image/*" />
          </LandingSectionPanel>
        )}

        {open === "services" && (
          <LandingSectionPanel
            id="services"
            emoji="🛠️"
            title="خدمات"
            subtitle="سکشن #services"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, pages: { ...pages, services: pages.services } })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.servicesLabel} onChange={(v) => patchLanding("servicesLabel", v)} />
            <Field label="تیتر" value={landing.servicesTitle} onChange={(v) => patchLanding("servicesTitle", v)} />
            <Field label="توضیح" value={landing.servicesIntro} onChange={(v) => patchLanding("servicesIntro", v)} multiline />
            {pages.services.map((svc, i) => (
              <div key={svc.id} className="landing-item-card">
                <strong>خدمت {i + 1}</strong>
                <Field label="عنوان" value={svc.title} onChange={(v) => {
                  const services = [...pages.services];
                  services[i] = { ...services[i], title: v };
                  setContent({ ...content, pages: { ...pages, services } });
                }} />
                <Field label="توضیح" value={svc.description} onChange={(v) => {
                  const services = [...pages.services];
                  services[i] = { ...services[i], description: v };
                  setContent({ ...content, pages: { ...pages, services } });
                }} multiline />
                <Field label="لینک" value={svc.href} onChange={(v) => {
                  const services = [...pages.services];
                  services[i] = { ...services[i], href: v };
                  setContent({ ...content, pages: { ...pages, services } });
                }} />
              </div>
            ))}
          </LandingSectionPanel>
        )}

        {open === "portfolio" && (
          <LandingSectionPanel
            id="portfolio"
            emoji="🎨"
            title="نمونه کارها"
            subtitle="سکشن #portfolio"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.portfolioLabel} onChange={(v) => patchLanding("portfolioLabel", v)} />
            <Field label="تیتر" value={landing.portfolioTitle} onChange={(v) => patchLanding("portfolioTitle", v)} />
            <p className="landing-section-hint">{content.portfolio.length} کارت — فرم افزودن بالا، لیست جمع‌شونده برای ویرایش</p>
            <div className="admin-editor-shell">
              <AdminEditor embedded compact sectionOnly="portfolio" onContentChange={setContent} />
            </div>
          </LandingSectionPanel>
        )}

        {open === "process" && (
          <LandingSectionPanel
            id="process"
            emoji="🔄"
            title="فرایند همکاری"
            subtitle="سکشن #process"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, pages: { ...pages, processSteps: pages.processSteps } })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.processLabel} onChange={(v) => patchLanding("processLabel", v)} />
            <Field label="تیتر" value={landing.processTitle} onChange={(v) => patchLanding("processTitle", v)} />
            <Field label="لینک جزئیات" value={landing.processLinkText} onChange={(v) => patchLanding("processLinkText", v)} />
            <Field label="آدرس لینک" value={landing.processLinkHref} onChange={(v) => patchLanding("processLinkHref", v)} />
            {pages.processSteps.map((step, i) => (
              <div key={step.id} className="landing-item-card">
                <strong>مرحله {step.id}</strong>
                <Field label="عنوان" value={step.title} onChange={(v) => {
                  const processSteps = [...pages.processSteps];
                  processSteps[i] = { ...processSteps[i], title: v };
                  setContent({ ...content, pages: { ...pages, processSteps } });
                }} />
                <Field label="توضیح" value={step.description} onChange={(v) => {
                  const processSteps = [...pages.processSteps];
                  processSteps[i] = { ...processSteps[i], description: v };
                  setContent({ ...content, pages: { ...pages, processSteps } });
                }} multiline />
              </div>
            ))}
          </LandingSectionPanel>
        )}

        {open === "plans" && (
          <LandingSectionPanel
            id="plans"
            emoji="💰"
            title="پلن‌ها"
            subtitle="سکشن #plans"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, plans })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.plansLabel} onChange={(v) => patchLanding("plansLabel", v)} />
            <Field label="تیتر" value={landing.plansTitle} onChange={(v) => patchLanding("plansTitle", v)} />
            <Field label="توضیح" value={landing.plansIntro} onChange={(v) => patchLanding("plansIntro", v)} multiline />
            {plans.map((plan, i) => (
              <div key={plan.id} className="landing-item-card">
                <strong>{plan.name}</strong>
                <Field label="نام" value={plan.name} onChange={(v) => {
                  const next = [...plans];
                  next[i] = { ...next[i], name: v };
                  setContent({ ...content, plans: next });
                }} />
                <Field label="توضیح" value={plan.description} onChange={(v) => {
                  const next = [...plans];
                  next[i] = { ...next[i], description: v };
                  setContent({ ...content, plans: next });
                }} multiline />
                <Field label="قیمت" value={plan.price} onChange={(v) => {
                  const next = [...plans];
                  next[i] = { ...next[i], price: v };
                  setContent({ ...content, plans: next });
                }} />
                <label className="contact-field flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    checked={plan.featured}
                    onChange={(e) => {
                      const next = [...plans];
                      next[i] = { ...next[i], featured: e.target.checked };
                      setContent({ ...content, plans: next });
                    }}
                  />
                  <span>پلن پیشنهادی (هایلایت)</span>
                </label>
                <Field
                  label="ویژگی‌ها (هر خط یک مورد)"
                  value={plan.features.join("\n")}
                  onChange={(v) => {
                    const next = [...plans];
                    next[i] = { ...next[i], features: v.split("\n").filter(Boolean) };
                    setContent({ ...content, plans: next });
                  }}
                  multiline
                />
              </div>
            ))}
          </LandingSectionPanel>
        )}

        {open === "backstage" && (
          <LandingSectionPanel
            id="backstage"
            emoji="📸"
            title="بک‌استیج"
            subtitle="سکشن #backstage"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, teamStats })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.backstageLabel} onChange={(v) => patchLanding("backstageLabel", v)} />
            <Field label="تیتر" value={landing.backstageTitle} onChange={(v) => patchLanding("backstageTitle", v)} />
            <Field label="توضیح" value={landing.backstageIntro} onChange={(v) => patchLanding("backstageIntro", v)} multiline />
            {teamStats.map((stat, i) => (
              <div key={i} className="landing-item-card">
                <Field label="مقدار" value={stat.value} onChange={(v) => {
                  const next = [...teamStats];
                  next[i] = { ...next[i], value: v };
                  setContent({ ...content, teamStats: next });
                }} />
                <Field label="برچسب" value={stat.label} onChange={(v) => {
                  const next = [...teamStats];
                  next[i] = { ...next[i], label: v };
                  setContent({ ...content, teamStats: next });
                }} />
              </div>
            ))}
            <p className="landing-section-hint">{content.backstage.length} کارت — روی هر کارت کلیک کنید تا باز شود</p>
            <div className="admin-editor-shell">
              <AdminEditor embedded compact sectionOnly="backstage" onContentChange={setContent} />
            </div>
          </LandingSectionPanel>
        )}

        {open === "partners-creative" && (
          <LandingSectionPanel
            id="partners-creative"
            emoji="🎬"
            title="همکاران خلاق"
            subtitle="سکشن #creative-partners"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, creativePartners })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.creativePartnersLabel} onChange={(v) => patchLanding("creativePartnersLabel", v)} />
            <Field label="تیتر" value={landing.creativePartnersTitle} onChange={(v) => patchLanding("creativePartnersTitle", v)} />
            <Field label="توضیح" value={landing.creativePartnersIntro} onChange={(v) => patchLanding("creativePartnersIntro", v)} multiline />
            <p className="landing-section-hint">{creativePartners.length} همکار — روی هر ردیف کلیک کنید تا فرم باز شود، سپس «ذخیره این بخش»</p>
            {creativePartners.map((p, i) => (
              <LandingItemCard
                key={p.id}
                index={i + 1}
                title={p.name || `همکار ${i + 1}`}
                subtitle={p.role || "بدون نقش"}
                previewSrc={
                  resolveMediaKind({ mediaKind: p.mediaKind, videoSrc: p.videoSrc }) === "video" && p.videoSrc
                    ? p.videoSrc
                    : p.avatarSrc
                }
                previewKind={
                  resolveMediaKind({ mediaKind: p.mediaKind, videoSrc: p.videoSrc }) === "video"
                    ? "video"
                    : "image"
                }
                onRemove={() => {
                  const next = creativePartners.filter((_, idx) => idx !== i);
                  setContent({ ...content, creativePartners: next });
                }}
              >
                <Field label="نام" value={p.name} onChange={(v) => {
                  const next = [...creativePartners];
                  next[i] = { ...next[i], name: v };
                  setContent({ ...content, creativePartners: next });
                }} />
                <Field label="نقش / تخصص" value={p.role} onChange={(v) => {
                  const next = [...creativePartners];
                  next[i] = { ...next[i], role: v };
                  setContent({ ...content, creativePartners: next });
                }} />
                <Field label="نمونه کار" value={p.showcase} onChange={(v) => {
                  const next = [...creativePartners];
                  next[i] = { ...next[i], showcase: v };
                  setContent({ ...content, creativePartners: next });
                }} />
                <Field label="درباره" value={p.bio} onChange={(v) => {
                  const next = [...creativePartners];
                  next[i] = { ...next[i], bio: v };
                  setContent({ ...content, creativePartners: next });
                }} multiline />
                <Field label="نقل‌قول" value={p.quote} onChange={(v) => {
                  const next = [...creativePartners];
                  next[i] = { ...next[i], quote: v };
                  setContent({ ...content, creativePartners: next });
                }} multiline />
                <MediaItemFields
                  compact
                  values={{
                    image: p.avatarSrc,
                    videoSrc: p.videoSrc,
                    mediaKind: p.mediaKind,
                    aspectRatio: p.aspectRatio,
                  }}
                  onChange={(patch) => {
                    const next = [...creativePartners];
                    next[i] = normalizeMediaFields({
                      ...next[i],
                      avatarSrc: patch.image ?? next[i].avatarSrc,
                      videoSrc: patch.videoSrc ?? next[i].videoSrc,
                      mediaKind: patch.mediaKind ?? next[i].mediaKind,
                      aspectRatio: patch.aspectRatio ?? next[i].aspectRatio,
                    });
                    setContent({ ...content, creativePartners: next });
                  }}
                  uploadKind="creative-partners"
                  imageLabel="آواتار / پوستر"
                />
              </LandingItemCard>
            ))}
            <button
              type="button"
              className="landing-add-btn"
              onClick={() =>
                setContent({
                  ...content,
                  creativePartners: [...creativePartners, emptyCreativePartner()],
                })
              }
            >
              + افزودن همکار جدید
            </button>
          </LandingSectionPanel>
        )}

        {open === "faq" && (
          <LandingSectionPanel
            id="faq"
            emoji="❓"
            title="FAQ"
            subtitle="سوالات متداول"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, faq })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.faqLabel} onChange={(v) => patchLanding("faqLabel", v)} />
            <Field label="تیتر" value={landing.faqTitle} onChange={(v) => patchLanding("faqTitle", v)} />
            <Field label="توضیح" value={landing.faqIntro} onChange={(v) => patchLanding("faqIntro", v)} multiline />
            {faq.map((item, i) => (
              <div key={i} className="landing-item-card">
                <Field label="سؤال" value={item.q} onChange={(v) => {
                  const next = [...faq];
                  next[i] = { ...next[i], q: v };
                  setContent({ ...content, faq: next });
                }} />
                <Field label="پاسخ" value={item.a} onChange={(v) => {
                  const next = [...faq];
                  next[i] = { ...next[i], a: v };
                  setContent({ ...content, faq: next });
                }} multiline />
              </div>
            ))}
          </LandingSectionPanel>
        )}

        {open === "testimonials" && (
          <LandingSectionPanel
            id="testimonials"
            emoji="💬"
            title="نظرات مشتریان"
            subtitle="سکشن #testimonials"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, testimonials })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.testimonialsLabel} onChange={(v) => patchLanding("testimonialsLabel", v)} />
            <Field label="تیتر" value={landing.testimonialsTitle} onChange={(v) => patchLanding("testimonialsTitle", v)} />
            <Field label="توضیح" value={landing.testimonialsIntro} onChange={(v) => patchLanding("testimonialsIntro", v)} multiline />
            <p className="landing-section-hint">{testimonials.length} نظر — پس از ویرایش «ذخیره این بخش» را بزنید</p>
            {testimonials.map((t, i) => (
              <LandingItemCard
                key={`testimonial-${i}`}
                index={i + 1}
                title={t.name || `نظر ${i + 1}`}
                subtitle={t.role || "بدون سمت"}
                onRemove={() => {
                  const next = testimonials.filter((_, idx) => idx !== i);
                  setContent({ ...content, testimonials: next });
                }}
              >
                <Field label="نام" value={t.name} onChange={(v) => {
                  const next = [...testimonials];
                  next[i] = { ...next[i], name: v };
                  setContent({ ...content, testimonials: next });
                }} />
                <Field label="سمت" value={t.role} onChange={(v) => {
                  const next = [...testimonials];
                  next[i] = { ...next[i], role: v };
                  setContent({ ...content, testimonials: next });
                }} />
                <Field label="نظر" value={t.quote} onChange={(v) => {
                  const next = [...testimonials];
                  next[i] = { ...next[i], quote: v };
                  setContent({ ...content, testimonials: next });
                }} multiline />
              </LandingItemCard>
            ))}
            <button
              type="button"
              className="landing-add-btn"
              onClick={() =>
                setContent({
                  ...content,
                  testimonials: [...testimonials, emptyTestimonial()],
                })
              }
            >
              + افزودن نظر جدید
            </button>
          </LandingSectionPanel>
        )}

        {open === "partners" && (
          <LandingSectionPanel
            id="partners"
            emoji="🤝"
            title="برندهای همکار"
            subtitle="سکشن Partners"
            open
            onToggle={() => undefined}
            onSave={() => save({ landing, partners })}
            saving={busy}
          >
            <Field label="برچسب" value={landing.partnersLabel} onChange={(v) => patchLanding("partnersLabel", v)} />
            <Field label="تیتر" value={landing.partnersTitle} onChange={(v) => patchLanding("partnersTitle", v)} />
            <p className="landing-section-hint">{partners.length} برند — لینk اختیاری؛ اگر پر شود لوگو قابل کلیک می‌شود</p>
            {partners.map((p, i) => (
              <LandingItemCard
                key={`partner-${i}`}
                index={i + 1}
                title={p.name || p.logo || `برند ${i + 1}`}
                subtitle={p.href ? "دارای لینk" : "بدون لینk"}
                onRemove={() => {
                  const next = partners.filter((_, idx) => idx !== i);
                  setContent({ ...content, partners: next });
                }}
              >
                <Field label="نام برند" value={p.name} onChange={(v) => {
                  const next = [...partners];
                  next[i] = { ...next[i], name: v };
                  setContent({ ...content, partners: next });
                }} />
                <Field label="متن نمایشی (روی لوگو)" value={p.logo} onChange={(v) => {
                  const next = [...partners];
                  next[i] = { ...next[i], logo: v };
                  setContent({ ...content, partners: next });
                }} />
                <Field label="لینk وب‌سایت (اختیاری)" value={p.href ?? ""} onChange={(v) => {
                  const next = [...partners];
                  next[i] = { ...next[i], href: v };
                  setContent({ ...content, partners: next });
                }} />
              </LandingItemCard>
            ))}
            <button
              type="button"
              className="landing-add-btn"
              onClick={() =>
                setContent({
                  ...content,
                  partners: [...partners, emptyPartner()],
                })
              }
            >
              + افزودن برند همکار
            </button>
          </LandingSectionPanel>
        )}

        {open === "site-brand" && (
          <LandingSectionPanel
            id="site-brand"
            emoji="🏷️"
            title="برند سایت"
            subtitle="نام، لوگو، رنگ — روی هدر و کل سایت"
            open
            onToggle={() => undefined}
            onSave={() => save({ site, theme })}
            saving={busy}
          >
            <Field label="نام کوتاه برند" value={site.name} onChange={(v) => setContent({ ...content, site: { ...site, name: v } })} />
            <Field label="عنوان SEO (title)" value={site.title} onChange={(v) => setContent({ ...content, site: { ...site, title: v } })} />
            <Field label="توضیح SEO" value={site.description} onChange={(v) => setContent({ ...content, site: { ...site, description: v } })} multiline />
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
                onChange={(e) =>
                  setContent({ ...content, theme: { ...theme, primaryColor: e.target.value } })
                }
              />
            </label>
          </LandingSectionPanel>
        )}

        {open === "footer" && (
          <LandingSectionPanel
            id="footer"
            emoji="📞"
            title="فوتر"
            subtitle="پایین صفحه + تماس"
            open
            onToggle={() => undefined}
            onSave={() =>
              save({
                landing,
                site,
                footerQuickLinks: content.footerQuickLinks,
                footerServiceLinks: content.footerServiceLinks,
              })
            }
            saving={busy}
          >
            <Field label="CTA — تیتر" value={landing.footerCtaTitle} onChange={(v) => patchLanding("footerCtaTitle", v)} />
            <Field label="CTA — متن" value={landing.footerCtaText} onChange={(v) => patchLanding("footerCtaText", v)} multiline />
            <Field label="CTA — دکمه" value={landing.footerCtaButton} onChange={(v) => patchLanding("footerCtaButton", v)} />
            <Field label="CTA — لینک" value={landing.footerCtaHref} onChange={(v) => patchLanding("footerCtaHref", v)} />
            <Field label="کپی‌رایت" value={landing.footerCopyright} onChange={(v) => patchLanding("footerCopyright", v)} />
            <Field label="تلفن" value={site.phone} onChange={(v) => setContent({ ...content, site: { ...site, phone: v } })} />
            <Field label="ایمیل" value={site.email} onChange={(v) => setContent({ ...content, site: { ...site, email: v } })} />
            <Field label="آدرس" value={site.address} onChange={(v) => setContent({ ...content, site: { ...site, address: v } })} />
            <Field label="متن معرفی فوتر" value={site.footerText} onChange={(v) => setContent({ ...content, site: { ...site, footerText: v } })} multiline />
            <h4 className="mt-4 font-bold">شبکه‌های اجتماعی</h4>
            {site.socials.map((s, i) => (
              <div key={i} className="landing-item-card">
                <Field label="نام" value={s.name} onChange={(v) => {
                  const socials = [...site.socials];
                  socials[i] = { ...socials[i], name: v };
                  setContent({ ...content, site: { ...site, socials } });
                }} />
                <Field label="لینk" value={s.href} onChange={(v) => {
                  const socials = [...site.socials];
                  socials[i] = { ...socials[i], href: v };
                  setContent({ ...content, site: { ...site, socials } });
                }} />
              </div>
            ))}
            <h4 className="mt-4 font-bold">لینک‌های سریع</h4>
            {content.footerQuickLinks.map((l, i) => (
              <div key={i} className="landing-item-card">
                <Field label="عنوان" value={l.label} onChange={(v) => {
                  const footerQuickLinks = [...content.footerQuickLinks];
                  footerQuickLinks[i] = { ...footerQuickLinks[i], label: v };
                  setContent({ ...content, footerQuickLinks });
                }} />
                <Field label="لینk" value={l.href} onChange={(v) => {
                  const footerQuickLinks = [...content.footerQuickLinks];
                  footerQuickLinks[i] = { ...footerQuickLinks[i], href: v };
                  setContent({ ...content, footerQuickLinks });
                }} />
              </div>
            ))}
            <h4 className="mt-4 font-bold">لینk خدمات فوتر</h4>
            {content.footerServiceLinks.map((l, i) => (
              <div key={i} className="landing-item-card">
                <Field label="عنوان" value={l.label} onChange={(v) => {
                  const footerServiceLinks = [...content.footerServiceLinks];
                  footerServiceLinks[i] = { ...footerServiceLinks[i], label: v };
                  setContent({ ...content, footerServiceLinks });
                }} />
                <Field label="لینk" value={l.href} onChange={(v) => {
                  const footerServiceLinks = [...content.footerServiceLinks];
                  footerServiceLinks[i] = { ...footerServiceLinks[i], href: v };
                  setContent({ ...content, footerServiceLinks });
                }} />
              </div>
            ))}
          </LandingSectionPanel>
        )}
      </div>
    </section>
  );
}
