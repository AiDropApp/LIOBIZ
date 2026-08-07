"use client";

import { useRef, useState } from "react";
import ContentImage from "@/components/ContentImage";
import CmsMedia from "@/components/CmsMedia";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { useCmsCardEditScope } from "@/components/cms-edit/CmsCardEditContext";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { cmsUploadFile } from "@/lib/cms-edit-upload";
import { isVideoUrl } from "@/lib/media-types";

import type { MediaSection } from "@/lib/filesir/types";

type Props = {
  path: string;
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
  uploadKind?: "hero" | "about" | "blog";
  fillParent?: boolean;
  children?: React.ReactNode;
};

function entryToUrl(entry: LibraryEntry): string {
  if (entry.previewUrl?.trim()) return entry.previewUrl;
  if (entry.localPath) {
    if (entry.localPath.startsWith("uploads/")) {
      const apiRel = entry.localPath.replace(/^uploads\//, "");
      return `/api/media/${apiRel.split("/").map(encodeURIComponent).join("/")}`;
    }
    return publicMediaUrl(entry.localPath);
  }
  if (entry.id) return `/api/media/filesir/${entry.id}`;
  return "";
}

function MediaPreview({
  src,
  alt,
  className = "",
  fill,
  sizes,
  priority,
  objectFit = "cover",
  fillParent = true,
  showControls = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
  fillParent?: boolean;
  showControls?: boolean;
}) {
  if (isVideoUrl(src)) {
    return (
      <CmsMedia
        image=""
        videoSrc={src}
        mediaKind="video"
        alt={alt}
        fill={fill}
        fitParent={fillParent}
        className={className}
        sizes={sizes}
        priority={priority}
        objectFit={objectFit}
        controls={showControls}
        videoClassName="cms-editable-video"
      />
    );
  }

  return (
    <ContentImage
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      style={objectFit ? { objectFit } : undefined}
    />
  );
}

function uploadKindToSection(kind: Props["uploadKind"]): MediaSection {
  if (kind === "blog") return "blog";
  return "portfolio";
}

export default function EditableImage({
  path,
  src,
  alt,
  className = "",
  fill,
  sizes,
  priority,
  objectFit = "cover",
  uploadKind = "hero",
  fillParent = true,
  children,
}: Props) {
  const cms = useCmsEdit();
  const inCardScope = useCmsCardEditScope();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const current = cms?.getField(path, src) || src;

  if (!cms?.isAdmin || !cms.editMode || inCardScope) {
    if (children) return <>{children}</>;
    if (!current?.trim()) return null;
    return (
      <MediaPreview
        src={current}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        objectFit={objectFit}
        fillParent={fillParent}
      />
    );
  }

  const applyUrl = async (url: string) => {
    cms.updateLocal(path, url);
    await cms.saveField(path, url);
    setOverlayOpen(false);
  };

  const uploadFile = async (file: File) => {
    const url = await cmsUploadFile(file, uploadKind);
    await applyUrl(url);
  };

  const openLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOverlayOpen(false);
    setPickerOpen(true);
  };

  const wrapClass = `cms-editable-image-wrap${fillParent ? " is-fill" : ""}${overlayOpen ? " is-open" : ""}`;

  return (
    <>
      <div
        className={wrapClass}
        onClick={() => setOverlayOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOverlayOpen((v) => !v);
          }
        }}
        role="button"
        tabIndex={0}
        title="کلیک برای تغییر تصویر"
      >
        {children}
        {!children && current?.trim() ? (
          <MediaPreview
            src={current}
            alt={alt}
            fill={fill}
            className={className}
            sizes={sizes}
            priority={priority}
            objectFit={objectFit}
            fillParent={fillParent}
            showControls
          />
        ) : !children && !current?.trim() ? (
          <div className="cms-editable-image-placeholder">+ تصویر</div>
        ) : null}
        <div
          className="cms-editable-image-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="cms-edit-btn is-primary"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openLibrary}
          >
            انتخاب از کتابخانه
          </button>
          <button
            type="button"
            className="cms-edit-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
          >
            آپلود
          </button>
          <button
            type="button"
            className="cms-edit-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setOverlayOpen(false);
            }}
          >
            بستن
          </button>
        </div>
        <span className="cms-editable-image-badge">🖼️</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </div>
      <MediaPickerModal
        open={pickerOpen}
        title="انتخاب رسانه"
        section={uploadKindToSection(uploadKind)}
        filterTypes="image,video"
        onClose={() => setPickerOpen(false)}
        onSelect={(entry) => void applyUrl(entryToUrl(entry))}
      />
    </>
  );
}
