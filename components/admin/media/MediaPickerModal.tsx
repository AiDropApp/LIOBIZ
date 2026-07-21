"use client";

import { X } from "lucide-react";
import MediaLibraryBrowser, { type LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import type { MediaSection } from "@/lib/filesir/types";

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
  folderId,
  filterTypes,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="admin-media-modal-backdrop" onClick={onClose}>
      <div className="admin-media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-media-modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn-sm" onClick={onClose} aria-label="بستن">
            <X size={16} />
          </button>
        </div>
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
  );
}
