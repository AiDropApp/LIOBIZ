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
  /** Hide aspect selector (use inside "more" for portfolio) */
  showAspect?: boolean;
};

export default function MediaItemFields({
  values,
  onChange,
  uploadKind,
  imageLabel,
  compact = false,
  showAspect = true,
}: Props) {
  const kind = values.mediaKind ?? "image";
  const coverLabel =
    imageLabel || (kind === "video" ? "کاور کارت (تصویر)" : "تصویر / کاور");

  return (
    <div className={`landing-media-fields${compact ? " landing-media-fields--compact" : ""}`}>
      <label className="contact-field">
        <span>نوع نمایش</span>
        <select
          value={kind}
          onChange={(e) => onChange({ mediaKind: e.target.value as MediaKind })}
        >
          {MEDIA_KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {showAspect ? (
        <label className="contact-field">
          <span>نسبت در جزئیات</span>
          <select
            value={values.aspectRatio ?? "portrait"}
            onChange={(e) => onChange({ aspectRatio: e.target.value as MediaAspect })}
          >
            {MEDIA_ASPECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <MediaUrlField
        label={coverLabel}
        value={values.image}
        onChange={(url) => onChange({ image: url })}
        uploadKind={uploadKind}
        accept="image/*"
        hint={
          kind === "video"
            ? "روی کارت‌ها فقط همین کاور نمایش داده می‌شود"
            : "آپلود یا لینک تصویر"
        }
      />

      {kind === "video" && (
        <MediaUrlField
          label="ویدیو (آپلود یا لینک)"
          value={values.videoSrc ?? ""}
          onChange={(url) => onChange({ videoSrc: url })}
          uploadKind={uploadKind}
          accept="video/*"
          hint="لینک مستقیم (هر پسوند ویدیو)، یا صفحه اشتراک مثل my.files.ir /drive/s/...، Google Drive، آپارات، یوتیوب — لینک پوشه کار نمی‌کند"
        />
      )}
    </div>
  );
}
