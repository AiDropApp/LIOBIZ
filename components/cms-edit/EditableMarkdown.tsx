"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import CmsRichText from "@/components/CmsRichText";
import { useModalScrollLock, useScrollContainerWheel } from "@/hooks/useModalScrollLock";

type Props = {
  path: string;
  fallback?: string;
  className?: string;
  paragraphClassName?: string;
  label?: string;
};

/** Inline markdown editor (blog body, etc.) */
export default function EditableMarkdown({ path, fallback = "", className = "", paragraphClassName, label = "✏️" }: Props) {
  const cms = useCmsEdit();
  const useLiveField = Boolean(cms?.isAdmin && cms.editMode);
  const raw = useLiveField ? (cms?.getField(path, fallback) ?? fallback) : fallback;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(raw);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useModalScrollLock(open);
  useScrollContainerWheel(bodyRef, open);

  useEffect(() => {
    if (open) setDraft(raw);
  }, [open, raw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!cms?.isAdmin || !cms.editMode) {
    return <CmsRichText content={raw} className={className} paragraphClassName={paragraphClassName} />;
  }

  const save = async () => {
    cms.updateLocal(path, draft);
    await cms.saveField(path, draft);
    setOpen(false);
  };

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="cms-rt-modal-backdrop is-card-editor" onClick={() => setOpen(false)}>
            <div className="cms-md-modal cms-card-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
              <div className="cms-rt-modal-head">
                <strong>ویرایش محتوا (Markdown)</strong>
                <button type="button" className="cms-modal-close-btn" onClick={() => setOpen(false)} aria-label="بستن">
                  ✕
                </button>
              </div>
              <textarea
                ref={bodyRef}
                className="cms-md-textarea cms-card-modal-body"
                rows={16}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="متن markdown — لینک: [متن](url) — تصویر: ![alt](url)"
              />
              <div className="cms-edit-popover-actions">
                <button type="button" className="cms-edit-btn is-primary" onClick={() => void save()}>
                  ذخیره
                </button>
                <button type="button" className="cms-edit-btn" onClick={() => setOpen(false)}>
                  انصراف
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" className={`cms-editable-rich-trigger ${className}`.trim()} onClick={() => setOpen(true)}>
        <CmsRichText content={raw} className={className} paragraphClassName={paragraphClassName} />
        <span className="cms-editable-badge">{label}</span>
      </button>
      {modal}
    </>
  );
}
