"use client";

import { useCallback, useState, type FormEvent } from "react";
import { SITE } from "@/lib/constants";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";
import TurnstileField from "@/components/TurnstileField";
import SimpleCaptcha from "@/components/SimpleCaptcha";
import EditableText from "@/components/cms-edit/EditableText";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

type FormLabels = {
  formTitle: string;
  formIntro: string;
  nameLabel: string;
  messageLabel: string;
  submitLabel: string;
};

export default function ContactForm({ labels }: { labels: FormLabels }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    if (!isValidEmail(email)) {
      setStatus("error");
      setFeedback("لطفاً یک آدرس ایمیل معتبر وارد کنید.");
      return;
    }
    if (!isValidIranPhone(phone)) {
      setStatus("error");
      setFeedback("شماره تماس معتبر نیست. مثال: 09121234567");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatus("error");
      setFeedback("لطفاً تأیید امنیتی را تکمیل کنید.");
      return;
    }
    if (!TURNSTILE_SITE_KEY && !turnstileToken.startsWith("math:")) {
      setStatus("error");
      setFeedback("لطفاً تأیید امنیتی (جمع اعداد) را تکمیل کنید.");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, website, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data.message || "ارسال پیام ناموفق بود.");
        return;
      }
      setStatus("ok");
      setFeedback("پیام شما دریافت شد. به‌زودی همکاران ما با شما تماس خواهند گرفت.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setWebsite("");
      setTurnstileToken("");
    } catch {
      setStatus("error");
      setFeedback("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    }
  };

  return (
    <form className="contact-form lux-card" onSubmit={onSubmit}>
      <EditableText path="pages.contact.formTitle" as="h2" className="mb-2 text-xl font-bold">
        {labels.formTitle}
      </EditableText>
      <EditableText path="pages.contact.formIntro" as="p" className="mb-6 text-sm text-muted" multiline>
        {labels.formIntro}
      </EditableText>

      <label className="contact-field" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <span>وب‌سایت</span>
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>

      <label className="contact-field">
        <EditableText path="pages.contact.nameLabel" as="span">
          {labels.nameLabel}
        </EditableText>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثلاً سارا محمدی" />
      </label>

      <label className="contact-field">
        <span>ایمیل</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          dir="ltr"
          placeholder={SITE.email}
        />
      </label>

      <label className="contact-field">
        <span>شماره تماس</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          dir="ltr"
          inputMode="tel"
          placeholder={SITE.phone}
        />
      </label>

      <label className="contact-field">
        <EditableText path="pages.contact.messageLabel" as="span">
          {labels.messageLabel}
        </EditableText>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="درباره پروژه، هدف و زمان‌بندی مدنظرتان بنویسید..."
        />
      </label>

      {TURNSTILE_SITE_KEY ? (
        <TurnstileField siteKey={TURNSTILE_SITE_KEY} onToken={onTurnstile} onExpire={onTurnstileExpire} />
      ) : (
        <SimpleCaptcha onToken={setTurnstileToken} />
      )}

      {feedback && (
        <p className={`text-sm ${status === "ok" ? "text-emerald-700" : "text-red-600"}`}>{feedback}</p>
      )}

      <button
        type="submit"
        className="btn-accent w-full justify-center py-3.5"
        disabled={status === "loading"}
      >
        {status === "loading" ? "در حال ارسال..." : labels.submitLabel}
      </button>
    </form>
  );
}
