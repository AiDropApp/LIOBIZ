"use client";

import { useRef, useState } from "react";
import { isVideoUrl, needsIframeVideoEmbed, toPlayableVideoUrl } from "@/lib/media-types";
import { uploadMediaFile } from "@/lib/media-center/upload-client";
import type { MediaSection } from "@/lib/filesir/types";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  /** Legacy local upload folder kind (used when filesirSection is not set). */
  uploadKind?: string;
  /** Upload to Files.ir section folder and store `/api/media/filesir/{id}` URL. */
  filesirSection?: MediaSection;
  hint?: string;
};

function filesirProxyUrl(entryId: number, isVideo: boolean) {
  return isVideo ? `/api/media/filesir/${entryId}` : `/api/media/filesir/${entryId}?thumb=1`;
}

function adminPreviewUrl(value: string): string | null {
  const match = value.match(/\/api\/media\/filesir\/(\d+)/);
  if (!match) return null;
  return `/api/admin/media/preview/${match[1]}`;
}

export default function MediaUrlField({
  label,
  value,
  onChange,
  accept = "image/*,video/*",
  uploadKind = "uploads",
  filesirSection,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      if (filesirSection) {
        const result = await uploadMediaFile(file, { section: filesirSection });
        const isVideo = file.type.startsWith("video/") || result.fileEntry.type === "video";
        onChange(filesirProxyUrl(result.fileEntry.id, isVideo));
        return;
      }

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
  const previewSrc = filesirSection ? adminPreviewUrl(value) || value : value;

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
        <span>یا آپلود فایل{filesirSection ? " (MyFile / بلاگ)" : ""}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        {uploading && <small className="text-muted">در حال آپلود...</small>}
      </label>
      {value && (
        <div className="landing-media-preview">
          {showVideo ? (
            needsIframeVideoEmbed(value) ? (
              <iframe
                src={toPlayableVideoUrl(previewSrc)}
                title="پیش‌نمایش ویدیو"
                className="landing-media-preview-frame"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <video src={toPlayableVideoUrl(previewSrc)} muted playsInline controls className="max-h-32 rounded-lg" />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="max-h-32 rounded-lg object-cover" />
          )}
        </div>
      )}
    </div>
  );
}

export async function uploadBlogMedia(file: File): Promise<string> {
  const result = await uploadMediaFile(file, { section: "blog" });
  const isVideo = file.type.startsWith("video/") || result.fileEntry.type === "video";
  return filesirProxyUrl(result.fileEntry.id, isVideo);
}
