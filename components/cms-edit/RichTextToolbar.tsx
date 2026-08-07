"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, AlignCenter, AlignLeft, AlignRight, Link2, Trash2 } from "lucide-react";
import { FONT_SIZE_OPTIONS } from "@/lib/cms-edit-font-size";

export const CMS_FONT_OPTIONS = [
  { label: "پیش‌فرض سایت (وزیرمتن)", value: "var(--font-vazirmatn), Vazirmatn, sans-serif" },
  { label: "وزیرمتن", value: "Vazirmatn, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
] as const;

type Props = {
  editor: Editor | null;
  onSave: () => void;
  onClear?: () => void;
  clearLabel?: string;
};

function toolbarMouseDown(e: React.MouseEvent) {
  e.preventDefault();
}

function keepEditorFocus(e: React.MouseEvent) {
  e.stopPropagation();
}

function readActiveFont(editor: Editor): string {
  const family = editor.getAttributes("textStyle").fontFamily as string | undefined;
  return family?.trim() || "";
}

function readActiveSize(editor: Editor): string {
  const size = editor.getAttributes("textStyle").fontSize as string | undefined;
  return size?.trim() || "";
}

function withTextTarget(editor: Editor, run: (chain: ReturnType<Editor["chain"]>) => void) {
  const chain = editor.chain().focus();
  if (editor.state.selection.empty) {
    chain.selectAll();
  }
  run(chain);
  chain.run();
}

export default function RichTextToolbar({ editor, onSave, onClear, clearLabel = "حذف از صفحه" }: Props) {
  const [, tick] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const linkWrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!editor) return;
    const refresh = () => tick((n) => n + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  useEffect(() => {
    if (!linkOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (linkWrapRef.current?.contains(e.target as Node)) return;
      setLinkOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [linkOpen]);

  if (!editor) return null;

  const activeFont = readActiveFont(editor);
  const activeSize = readActiveSize(editor);

  const openLinkEditor = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkDraft(prev?.trim() || "https://");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkDraft.trim();
    withTextTarget(editor, (chain) => {
      if (!url) chain.extendMarkRange("link").unsetLink();
      else chain.extendMarkRange("link").setLink({ href: url });
    });
    setLinkOpen(false);
  };

  const removeLink = () => {
    withTextTarget(editor, (chain) => chain.extendMarkRange("link").unsetLink());
    setLinkOpen(false);
  };

  return (
    <div className="cms-rt-toolbar" dir="rtl">
      <button
        type="button"
        className={editor.isActive("bold") ? "is-on" : ""}
        onMouseDown={toolbarMouseDown}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="درشت"
      >
        <Bold size={15} />
      </button>
      <button
        type="button"
        className={editor.isActive("italic") ? "is-on" : ""}
        onMouseDown={toolbarMouseDown}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="کج"
      >
        <Italic size={15} />
      </button>
      <span className="cms-rt-sep" />
      <span className="cms-rt-link-wrap" ref={linkWrapRef}>
        <button
          type="button"
          className={editor.isActive("link") ? "is-on" : ""}
          onMouseDown={toolbarMouseDown}
          onClick={openLinkEditor}
          title="لینک"
          aria-expanded={linkOpen}
        >
          <Link2 size={15} />
        </button>
        {linkOpen ? (
          <div className="cms-rt-link-popover" onMouseDown={keepEditorFocus}>
            <input
              type="url"
              className="cms-rt-link-input"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setLinkOpen(false);
                }
              }}
            />
            <button type="button" className="cms-rt-link-apply" onClick={applyLink}>
              اعمال
            </button>
            {editor.isActive("link") ? (
              <button type="button" className="cms-rt-link-remove" onClick={removeLink}>
                حذف
              </button>
            ) : null}
          </div>
        ) : null}
      </span>
      <span className="cms-rt-sep" />
      <button
        type="button"
        className={editor.isActive({ textAlign: "right" }) ? "is-on" : ""}
        onMouseDown={toolbarMouseDown}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="راست"
      >
        <AlignRight size={15} />
      </button>
      <button
        type="button"
        className={editor.isActive({ textAlign: "center" }) ? "is-on" : ""}
        onMouseDown={toolbarMouseDown}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="وسط"
      >
        <AlignCenter size={15} />
      </button>
      <button
        type="button"
        className={editor.isActive({ textAlign: "left" }) ? "is-on" : ""}
        onMouseDown={toolbarMouseDown}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="چپ"
      >
        <AlignLeft size={15} />
      </button>
      <span className="cms-rt-sep" />
      <select
        className="cms-rt-select cms-rt-select--size"
        value={activeSize}
        onMouseDown={keepEditorFocus}
        onChange={(e) => {
          const size = e.target.value;
          withTextTarget(editor, (chain) => {
            if (!size) chain.unsetFontSize();
            else chain.setFontSize(size);
          });
        }}
        title="اندازه"
        aria-label="اندازه متن"
      >
        <option value="">اندازه</option>
        {FONT_SIZE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace("px", "")} px
          </option>
        ))}
      </select>
      <select
        className="cms-rt-select cms-rt-select--font"
        value={activeFont}
        onMouseDown={keepEditorFocus}
        onChange={(e) => {
          const font = e.target.value;
          withTextTarget(editor, (chain) => {
            if (!font) chain.unsetFontFamily();
            else chain.setFontFamily(font);
          });
        }}
        title="فونت"
        aria-label="فونت"
      >
        <option value="">فونت</option>
        {CMS_FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
      <input
        type="color"
        className="cms-rt-color"
        title="رنگ متن"
        defaultValue="#111111"
        onMouseDown={keepEditorFocus}
        onChange={(e) => withTextTarget(editor, (chain) => chain.setColor(e.target.value))}
      />
      <span className="cms-rt-sep" />
      {onClear ? (
        <button
          type="button"
          className="cms-rt-clear"
          onMouseDown={toolbarMouseDown}
          onClick={onClear}
          title={clearLabel}
        >
          <Trash2 size={14} />
          {clearLabel}
        </button>
      ) : null}
      <button type="button" className="cms-rt-save" onMouseDown={toolbarMouseDown} onClick={onSave}>
        ذخیره
      </button>
    </div>
  );
}
