"use client";

import Link from "next/link";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

export default function CmsEditToolbar() {
  const cms = useCmsEdit();
  if (!cms?.isAdmin) return null;

  return (
    <div className={`cms-edit-toolbar${cms.editMode ? " is-active" : ""}`} dir="rtl">
      <div className="cms-edit-toolbar-inner">
        <span className="cms-edit-toolbar-title">مدیریت محتوا</span>
        <button
          type="button"
          className={`cms-edit-btn${cms.editMode ? " is-primary" : ""}`}
          onClick={() => cms.setEditMode(!cms.editMode)}
        >
          {cms.editMode ? "✓ حالت ویرایش فعال" : "✏️ ویرایش این صفحه"}
        </button>
        {cms.editMode ? (
          <span className="cms-edit-hint">روی متن یا عکس کلیک کنید</span>
        ) : (
          <Link href="/admin" className="cms-edit-link">
            پنل ادمین
          </Link>
        )}
        {cms.saving ? <span className="cms-edit-saving">در حال ذخیره…</span> : null}
      </div>
    </div>
  );
}
