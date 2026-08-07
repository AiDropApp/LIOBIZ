"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import MediaLibraryBrowser, { type LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import type { MediaSection } from "@/lib/filesir/types";
import { useModalScrollLock, useScrollContainerWheel } from "@/hooks/useModalScrollLock";

type Props = {
  open: boolean;
  title: string;
  section: MediaSection;
  folderId?: number;
  filterTypes?: string;
  onClose: () => void;
  onSelect: (entry: LibraryEntry) => void;
};

export default function MediaPickerModal({
  open,
  title,
  section,
  filterTypes,
  onClose,
  onSelect,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useModalScrollLock(open);
  useScrollContainerWheel(bodyRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="cms-media-picker-backdrop" onClick={onClose}>
      <div className="cms-media-picker-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="cms-media-picker-head">
          <h3>{title}</h3>
          <button type="button" className="cms-modal-close-btn" onClick={onClose} aria-label="بستن">
            <X size={16} aria-hidden />
          </button>
        </div>
        <div ref={bodyRef} className="cms-media-picker-body">
          <MediaLibraryBrowser
            section={section}
            mode="pick"
            filterTypes={filterTypes}
            onPick={(entry) => {
              onSelect(entry);
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
