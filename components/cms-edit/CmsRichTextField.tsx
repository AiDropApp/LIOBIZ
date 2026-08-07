"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { FontSize } from "@/lib/cms-edit-font-size";
import { isHtmlContent, plainToHtmlParagraph, sanitizeCmsHtml } from "@/lib/cms-html";
import { inlineHtmlForSemanticTag } from "@/lib/cms-field-display";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { useCmsCardEditScope } from "@/components/cms-edit/CmsCardEditContext";
import RichTextToolbar from "@/components/cms-edit/RichTextToolbar";
import CmsHtmlContent from "@/components/cms-edit/CmsHtmlContent";
import { useModalScrollLock, useScrollContainerWheel } from "@/hooks/useModalScrollLock";

export type CmsRichTextFieldProps = {
  path: string;
  fallback?: string;
  className?: string;
  paragraphClassName?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  dir?: "rtl" | "ltr" | "auto";
  /** Inline trigger for buttons / nav labels */
  inline?: boolean;
};

function FieldDisplay({
  content,
  as: Tag = "span",
  className = "",
  paragraphClassName,
  dir = "rtl",
}: {
  content: string;
  as?: CmsRichTextFieldProps["as"];
  className?: string;
  paragraphClassName?: string;
  dir?: CmsRichTextFieldProps["dir"];
}) {
  if (!content.trim()) return null;

  if (Tag === "span") {
    if (isHtmlContent(content)) {
      return (
        <span
          className={className}
          dir={dir}
          dangerouslySetInnerHTML={{ __html: inlineHtmlForSemanticTag(content) }}
        />
      );
    }
    return (
      <span className={className} dir={dir}>
        {content}
      </span>
    );
  }

  if (Tag === "p") {
    if (isHtmlContent(content)) {
      return (
        <p
          className={className}
          dir={dir}
          dangerouslySetInnerHTML={{ __html: inlineHtmlForSemanticTag(content) }}
        />
      );
    }
    return (
      <p className={className} dir={dir}>
        {content}
      </p>
    );
  }

  if (Tag === "div") {
    return (
      <CmsHtmlContent content={content} className={className} paragraphClassName={paragraphClassName} />
    );
  }

  if (isHtmlContent(content)) {
    return (
      <Tag
        className={className}
        dir={dir}
        dangerouslySetInnerHTML={{ __html: inlineHtmlForSemanticTag(content) }}
      />
    );
  }

  return (
    <Tag className={className} dir={dir}>
      {content}
    </Tag>
  );
}

export default function CmsRichTextField({
  path,
  fallback = "",
  className = "",
  paragraphClassName,
  as: Tag = "span",
  dir = "rtl",
  inline = false,
}: CmsRichTextFieldProps) {
  const cms = useCmsEdit();
  const inCardScope = useCmsCardEditScope();
  const useLiveField = Boolean(cms?.isAdmin && cms.editMode && !inCardScope);
  const raw = useLiveField ? (cms?.getField(path, fallback) ?? fallback) : fallback;
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialHtml = isHtmlContent(raw) ? raw : plainToHtmlParagraph(raw);

  useModalScrollLock(open);
  useScrollContainerWheel(bodyRef, open);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "cms-rt-editor prose-rtl",
        dir: "rtl",
      },
    },
  });

  useEffect(() => {
    if (!editor || !open) return;
    const html = isHtmlContent(raw) ? raw : plainToHtmlParagraph(raw);
    editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, open, raw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!cms?.isAdmin || !cms.editMode || inCardScope) {
    return (
      <FieldDisplay
        content={raw}
        as={Tag}
        className={className}
        paragraphClassName={paragraphClassName}
        dir={dir}
      />
    );
  }

  const save = async () => {
    if (!editor) return;
    const html = sanitizeCmsHtml(editor.getHTML());
    cms.updateLocal(path, html);
    await cms.saveField(path, html);
    setOpen(false);
  };

  const clearField = async () => {
    if (!window.confirm("این متن از صفحه حذف شود؟")) return;
    cms.updateLocal(path, "");
    await cms.saveField(path, "");
    setOpen(false);
  };

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="cms-rt-modal-backdrop is-card-editor" onClick={() => setOpen(false)}>
            <div className="cms-rt-modal cms-card-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
              <div className="cms-rt-modal-head">
                <strong>ویرایش متن</strong>
                <button type="button" className="cms-modal-close-btn" onClick={() => setOpen(false)} aria-label="بستن">
                  ✕
                </button>
              </div>
              <div ref={bodyRef} className="cms-rt-modal-scroll">
                <RichTextToolbar editor={editor} onSave={() => void save()} onClear={() => void clearField()} />
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const triggerClass = [
    "cms-editable-rich-trigger",
    inline ? "cms-editable-rich-trigger--inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={triggerClass}
        dir={dir}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }
        }}
        title="کلیک برای ویرایش متن"
      >
        {raw.trim() ? (
          <FieldDisplay
            content={raw}
            as={Tag}
            className={inline ? className : ""}
            paragraphClassName={paragraphClassName}
            dir={dir}
          />
        ) : (
          <span className="cms-editable-empty-hint">خالی — کلیک برای افزودن متن</span>
        )}
        <span className="cms-editable-badge" aria-hidden="true">
          ✏️
        </span>
      </span>
      {modal}
    </>
  );
}
