"use client";

import { useEffect, useRef, useState } from "react";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { useCmsCardEditScope } from "@/components/cms-edit/CmsCardEditContext";
import { getByPath } from "@/lib/cms-field-path";

export type PopoverField = {
  path: string;
  label: string;
  multiline?: boolean;
  dir?: "rtl" | "ltr";
  /** هر خط = یک آیتم آرایه (مثل features پلن) */
  linesToArray?: boolean;
};

type Props = {
  fields: PopoverField[];
  className?: string;
  buttonLabel?: string;
};

export default function CmsEditPopover({ fields, className = "", buttonLabel = "✏️ ویرایش" }: Props) {
  const cms = useCmsEdit();
  const inCardScope = useCmsCardEditScope();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !cms) return;
    const init: Record<string, string> = {};
    for (const field of fields) {
      if (field.linesToArray && cms.content) {
        const arr = getByPath(cms.content, field.path);
        init[field.path] = Array.isArray(arr) ? arr.map(String).join("\n") : "";
      } else {
        init[field.path] = cms.getField(field.path);
      }
    }
    setDraft(init);
  }, [open, fields, cms]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!cms?.isAdmin || !cms.editMode || inCardScope) return null;

  const save = async () => {
    for (const field of fields) {
      const raw = draft[field.path] ?? "";
      if (field.linesToArray) {
        const lines = raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        cms.updateLocal(field.path, lines);
        await cms.saveField(field.path, lines);
      } else {
        cms.updateLocal(field.path, raw);
        await cms.saveField(field.path, raw);
      }
    }
    setOpen(false);
  };

  return (
    <div className={`cms-edit-popover-wrap ${className}`.trim()} ref={panelRef}>
      <button type="button" className="cms-edit-popover-trigger" onClick={() => setOpen((v) => !v)}>
        {buttonLabel}
      </button>
      {open ? (
        <div className="cms-edit-popover" role="dialog" aria-label="ویرایش">
          {fields.map((field) => (
            <label key={field.path} className="cms-edit-popover-field">
              <span>{field.label}</span>
              {field.multiline || field.linesToArray ? (
                <textarea
                  rows={field.linesToArray ? 5 : 3}
                  dir={field.dir ?? "rtl"}
                  value={draft[field.path] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.path]: e.target.value }))}
                />
              ) : (
                <input
                  dir={field.dir ?? "rtl"}
                  value={draft[field.path] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.path]: e.target.value }))}
                />
              )}
            </label>
          ))}
          <div className="cms-edit-popover-actions">
            <button type="button" className="cms-edit-btn is-primary" onClick={() => void save()}>
              ذخیره
            </button>
            <button type="button" className="cms-edit-btn" onClick={() => setOpen(false)}>
              انصراف
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
