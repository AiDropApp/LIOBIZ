"use client";

import MediaUrlField from "@/components/admin/landing/MediaUrlField";
import {
  MEDIA_ASPECT_OPTIONS,
  MEDIA_KIND_OPTIONS,
  type MediaAspect,
  type MediaKind,
} from "@/lib/media-types";

export type MediaItemValues = {
  image: string;
  videoSrc?: string;
  mediaKind?: MediaKind;
  aspectRatio?: MediaAspect;
};

type Props = {
  values: MediaItemValues;
  onChange: (patch: Partial<MediaItemValues>) => void;
  uploadKind: "portfolio" | "backstage" | "creative-partners";
  imageLabel?: string;
  compact?: boolean;
};

export default function MediaItemFields({
  values,
  onChange,
  uploadKind,
  imageLabel = "تصویر / پوستر",
  compact = false,
}: Props) {
  const kind = values.mediaKind ?? "image";

  return (
    <div className={`landing-media-fields${compact ? " landing-media-fields--compact" : ""}`}>
      <label className="contact-field">
        <span>نوع نمایش</span>
        <select
          value={kind}
          onChange={(e) =>
            onChange({ mediaKind: e.target.value as MediaKind })
          }
        >
          {MEDIA_KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="contact-field">
        <span>نسبت تصویر</span>
        <select
          value={values.aspectRatio ?? "portrait"}
          onChange={(e) =>
            onChange({ aspectRatio: e.target.value as MediaAspect })
          }
        >
          {MEDIA_ASPECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <MediaUrlField
        label={imageLabel}
        value={values.image}
        onChange={(url) => onChange({ image: url })}
        uploadKind={uploadKind}
        accept="image/*"
        hint="برای ویدیو به‌عنوان پوستر (thumbnail) استفاده می‌شود"
      />

      {kind === "video" && (
        <MediaUrlField
          label="ویدیو (آپلود یا لینk)"
          value={values.videoSrc ?? ""}
          onChange={(url) => onChange({ videoSrc: url })}
          uploadKind={uploadKind}
          accept="video/mp4,video/webm"
          hint="mp4 یا webm — در سایت به‌صورت autoplay بی‌صدا نمایش داده می‌شود"
        />
      )}
    </div>
  );
}
