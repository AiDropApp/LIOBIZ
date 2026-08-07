"use client";

import { getByPath } from "@/lib/cms-field-path";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

type Props = {
  path: string;
  emptyItem: unknown;
  addLabel?: string;
  onRemove?: (index: number) => void;
  index?: number;
  className?: string;
};

/** Add/remove items in CMS array fields (edit mode only). */
export default function CmsArrayActions({
  path,
  emptyItem,
  addLabel = "+ افزودن",
  onRemove,
  index,
  className = "",
}: Props) {
  const cms = useCmsEdit();
  if (!cms?.isAdmin || !cms.editMode) return null;

  const current = cms.content ? (getByPath(cms.content, path) as unknown[]) : [];
  const items = Array.isArray(current) ? current : [];

  const saveArray = async (next: unknown[]) => {
    cms.updateLocal(path, next);
    await cms.saveField(path, next);
  };

  if (onRemove !== undefined && index !== undefined) {
    return (
      <button
        type="button"
        className={`cms-edit-array-remove ${className}`.trim()}
        onClick={() => void saveArray(items.filter((_, i) => i !== index))}
        title="حذف"
      >
        ✕
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`cms-edit-array-add ${className}`.trim()}
      onClick={() => void saveArray([...items, emptyItem])}
    >
      {addLabel}
    </button>
  );
}
