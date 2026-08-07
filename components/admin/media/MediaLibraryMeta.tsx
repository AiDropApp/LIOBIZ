"use client";

import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import {
  AutoDirText,
  LtrIsolate,
  MixedPathLabel,
  formatFileSizeLabel,
  formatPathLabel,
} from "@/lib/ltr-text";

function fieldLabel(field: string) {
  const map: Record<string, string> = {
    cover: "کاور",
    video: "ویدیو",
    image: "تصویر",
    avatar: "آواتار",
  };
  return map[field] || field;
}

export default function MediaLibraryMeta({
  file,
  isLinked,
}: {
  file: LibraryEntry;
  isLinked: boolean;
}) {
  const displayName = isLinked && file.linked ? file.linked.cardTitle : file.name;
  const folder = formatPathLabel(file.folderLabel);

  return (
    <div className="admin-media-library-meta">
      <AutoDirText as="strong" className="admin-media-library-filename" title={displayName}>
        {displayName}
      </AutoDirText>
      {folder ? (
        <MixedPathLabel path={folder} className="admin-media-library-path" title={folder} />
      ) : null}
      <LtrIsolate as="small" className="admin-media-library-size">
        {formatFileSizeLabel(file.file_size, file.type)}
      </LtrIsolate>
      {isLinked && file.linked ? (
        <p className="admin-media-library-link-info" dir="rtl">
          {file.linked.cardTitle} · {fieldLabel(file.linked.field)}
        </p>
      ) : (
        <p className="admin-media-library-hint" dir="rtl">
          هنوز به محتوا اختصاص داده نشده
        </p>
      )}
    </div>
  );
}
