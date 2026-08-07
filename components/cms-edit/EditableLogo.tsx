"use client";

import { useRef, useState } from "react";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { cmsUploadFile } from "@/lib/cms-edit-upload";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import Logo from "@/components/Logo";

function entryToUrl(entry: LibraryEntry): string {
  if (entry.localPath) return publicMediaUrl(entry.localPath);
  if (entry.id) return `/api/media/filesir/${entry.id}`;
  return entry.previewUrl || "";
}

export default function EditableLogo({ logoUrl }: { logoUrl: string }) {
  const cms = useCmsEdit();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const src = cms?.getField("site.logoUrl", logoUrl) || logoUrl;

  if (!cms?.isAdmin || !cms.editMode) {
    return <Logo height={72} src={src} />;
  }

  const applyUrl = async (url: string) => {
    cms.updateLocal("site.logoUrl", url);
    await cms.saveField("site.logoUrl", url);
    setOpen(false);
  };

  const uploadFile = async (file: File) => {
    const url = await cmsUploadFile(file, "about");
    await applyUrl(url);
  };

  return (
    <>
      <div
        className={`cms-editable-logo${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        title="کلیک برای تغییر لوگو"
      >
        <Logo height={72} src={src} />
        <div className="cms-editable-image-overlay" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="cms-edit-btn is-primary"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setPickerOpen(true);
            }}
          >
            کتابخانه
          </button>
          <button type="button" className="cms-edit-btn" onClick={() => fileRef.current?.click()}>
            آپلود
          </button>
        </div>
        <span className="cms-editable-image-badge">🖼️</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </div>
      <MediaPickerModal
        open={pickerOpen}
        title="انتخاب لوگو"
        section="portfolio"
        filterTypes="image"
        onClose={() => setPickerOpen(false)}
        onSelect={(entry) => void applyUrl(entryToUrl(entry))}
      />
    </>
  );
}
