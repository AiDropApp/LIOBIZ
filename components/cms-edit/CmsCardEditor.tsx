"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import CmsCardRichInput from "@/components/cms-edit/CmsCardRichInput";
import { CmsCardEditProvider } from "@/components/cms-edit/CmsCardEditContext";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { getByPath } from "@/lib/cms-field-path";
import { plainTextFromCmsValue } from "@/lib/cms-field-display";
import { cmsUploadFile } from "@/lib/cms-edit-upload";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import type { MediaSection } from "@/lib/filesir/types";
import type { CmsUploadKind } from "@/lib/cms-edit-upload";
import { useModalScrollLock, useScrollContainerWheel } from "@/hooks/useModalScrollLock";
export type CardEditField =
  | { type: "richtext"; path: string; label: string }
  | { type: "text"; path: string; label: string; dir?: "rtl" | "ltr"; plain?: boolean }
  | { type: "lines"; path: string; label: string }
  | {
      type: "image";
      path: string;
      label: string;
      src: string;
      uploadKind?: CmsUploadKind;
    }
  | { type: "checkbox"; path: string; label: string };

type Props = {
  title: string;
  fields: CardEditField[];
  className?: string;
  children: React.ReactNode;
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

function uploadKindToSection(kind?: CmsUploadKind): MediaSection {
  if (kind === "blog") return "blog";
  if (kind === "backstage") return "backstage";
  if (kind === "creative-partners") return "creative-partners";
  return "portfolio";
}

function CardEditorModal({
  title,
  fields,
  onClose,
}: {
  title: string;
  fields: CardEditField[];
  onClose: () => void;
}) {
  const cms = useCmsEdit();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickerPath, setPickerPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);

  useModalScrollLock(true);
  useScrollContainerWheel(bodyRef, true);

  useEffect(() => {
    if (!cms) return;
    const init: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === "lines" && cms.content) {
        const arr = getByPath(cms.content, field.path);
        init[field.path] = Array.isArray(arr) ? arr.map(String).join("\n") : "";
      } else if (field.type === "checkbox" && cms.content) {
        const val = getByPath(cms.content, field.path);
        init[field.path] = val ? "true" : "false";
      } else if (field.type === "image") {
        init[field.path] = cms.getField(field.path, field.src);
      } else {
        init[field.path] = cms.getField(field.path);
      }
    }
    setDraft(init);
  }, [cms, fields]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!cms) return null;

  const setField = (path: string, value: string) => {
    setDraft((d) => ({ ...d, [path]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const field of fields) {
        const raw = draft[field.path] ?? "";
        if (field.type === "lines") {
          const lines = raw
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          cms.updateLocal(field.path, lines);
          await cms.saveField(field.path, lines);
        } else if (field.type === "checkbox") {
          const checked = raw === "true";
          cms.updateLocal(field.path, checked);
          await cms.saveField(field.path, checked);
        } else {
          cms.updateLocal(field.path, raw);
          await cms.saveField(field.path, raw);
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const imageField = fields.find((f) => f.type === "image" && f.path === pickerPath);
  const uploadField = fields.find((f) => f.type === "image" && f.path === uploadPath);

  const modal = (
    <div className="cms-rt-modal-backdrop is-card-editor" onClick={onClose}>
      <div className="cms-card-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="cms-rt-modal-head">
          <strong>ویرایش: {plainTextFromCmsValue(title) || "کارت"}</strong>
          <button type="button" className="cms-modal-close-btn" onClick={onClose} aria-label="بستن">
            ✕
          </button>
        </div>

        <div ref={bodyRef} className="cms-card-modal-body">
          {fields.map((field) => {
            if (field.type === "richtext" || (field.type === "text" && !field.plain)) {
              return (
                <CmsCardRichInput
                  key={field.path}
                  label={field.label}
                  value={draft[field.path] ?? ""}
                  onChange={(html) => setField(field.path, html)}
                  onClear={() => {
                    if (!window.confirm(`«${field.label}» از صفحه حذف شود؟`)) return;
                    setField(field.path, "");
                  }}
                />
              );
            }

            if (field.type === "lines") {
              return (
                <label key={field.path} className="cms-card-field">
                  <span className="cms-card-field-label">{field.label}</span>
                  <textarea
                    rows={5}
                    value={draft[field.path] ?? ""}
                    onChange={(e) => setField(field.path, e.target.value)}
                    placeholder="هر خط = یک مورد"
                  />
                </label>
              );
            }

            if (field.type === "checkbox") {
              return (
                <label key={field.path} className="cms-card-field cms-card-field--checkbox">
                  <input
                    type="checkbox"
                    checked={draft[field.path] === "true"}
                    onChange={(e) => setField(field.path, e.target.checked ? "true" : "false")}
                  />
                  <span className="cms-card-field-label">{field.label}</span>
                </label>
              );
            }

            if (field.type === "image") {
              const url = draft[field.path] ?? "";
              return (
                <div key={field.path} className="cms-card-field">
                  <span className="cms-card-field-label">{field.label}</span>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="cms-card-image-preview" />
                  ) : (
                    <div className="cms-card-image-preview cms-card-image-preview--empty">بدون تصویر</div>
                  )}
                  <input
                    dir="ltr"
                    value={url}
                    onChange={(e) => setField(field.path, e.target.value)}
                    placeholder="https://..."
                    className="cms-card-text-input"
                  />
                  <div className="cms-card-image-actions">
                    <button
                      type="button"
                      className="cms-edit-btn is-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerPath(field.path);
                      }}
                    >
                      کتابخانه
                    </button>
                    <button
                      type="button"
                      className="cms-edit-btn"
                      onClick={() => {
                        setUploadPath(field.path);
                        fileRef.current?.click();
                      }}
                    >
                      آپلود
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <label key={field.path} className="cms-card-field">
                <span className="cms-card-field-label">{field.label}</span>
                <input
                  dir={field.dir ?? "rtl"}
                  value={draft[field.path] ?? ""}
                  onChange={(e) => setField(field.path, e.target.value)}
                  className="cms-card-text-input"
                />
              </label>
            );
          })}
        </div>

        <div className="cms-card-modal-foot">
          <button type="button" className="cms-edit-btn is-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
          <button type="button" className="cms-edit-btn" onClick={onClose}>
            انصراف
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const field = uploadField;
          if (!file || !field || field.type !== "image") return;
          void (async () => {
            const url = await cmsUploadFile(file, field.uploadKind ?? "about");
            setField(field.path, url);
            setUploadPath(null);
          })();
        }}
      />

      <MediaPickerModal
        open={Boolean(pickerPath && imageField)}
        title="انتخاب رسانه"
        section={imageField?.type === "image" ? uploadKindToSection(imageField.uploadKind) : "portfolio"}
        filterTypes="image,video"
        onClose={() => setPickerPath(null)}
        onSelect={(entry) => {
          if (pickerPath) setField(pickerPath, entryToUrl(entry));
          setPickerPath(null);
        }}
      />
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}

export default function CmsCardEditor({ title, fields, className = "", children }: Props) {
  const cms = useCmsEdit();
  const [open, setOpen] = useState(false);
  const inEdit = cms?.isAdmin && cms.editMode;

  if (!inEdit) return <>{children}</>;

  return (
    <CmsCardEditProvider active>
      <div className={`cms-card-edit-wrap ${className}`.trim()}>
        {children}
        <button
          type="button"
          className="cms-card-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label={`ویرایش ${plainTextFromCmsValue(title)}`}
          title="ویرایش این کارت"
        >
          ✏️ ویرایش
        </button>
        {open ? <CardEditorModal title={title} fields={fields} onClose={() => setOpen(false)} /> : null}
      </div>
    </CmsCardEditProvider>
  );
}
