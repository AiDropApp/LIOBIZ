"use client";

import { useState } from "react";
import { isVideoUrl, needsIframeVideoEmbed, toPlayableVideoUrl } from "@/lib/media-types";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  uploadKind: string;
  hint?: string;
};

export default function MediaUrlField({
  label,
  value,
  onChange,
  accept = "image/*,video/*",
  uploadKind,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", uploadKind);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
      onChange(data.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در آپلود");
    } finally {
      setUploading(false);
    }
  };

  const showVideo = isVideoUrl(value);

  return (
    <div className="landing-media-field">
      <label className="contact-field">
        <span>{label}</span>
        <input
          dir="ltr"
          placeholder="https://... (Drive، Files.ir، یوتیوب، لینک مستقیم) یا /api/media/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {hint && <small className="text-muted">{hint}</small>}
      </label>
      <label className="contact-field">
        <span>یا آپلود فایل</span>
        <input
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        {uploading && <small className="text-muted">در حال آپلود...</small>}
      </label>
      {value && (
        <div className="landing-media-preview">
          {showVideo ? (
            needsIframeVideoEmbed(value) ? (
              <iframe
                src={toPlayableVideoUrl(value)}
                title="پیش‌نمایش ویدیو"
                className="landing-media-preview-frame"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <video src={toPlayableVideoUrl(value)} muted playsInline controls className="max-h-32 rounded-lg" />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-32 rounded-lg object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
