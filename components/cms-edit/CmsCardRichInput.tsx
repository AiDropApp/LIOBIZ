"use client";

import { useEffect, useState } from "react";
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
import RichTextToolbar from "@/components/cms-edit/RichTextToolbar";

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  onClear?: () => void;
};

export default function CmsCardRichInput({ label, value, onChange, onClear }: Props) {
  const initialHtml = isHtmlContent(value) ? value : plainToHtmlParagraph(value);

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
      attributes: { class: "cms-rt-editor prose-rtl", dir: "rtl" },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeCmsHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = isHtmlContent(value) ? value : plainToHtmlParagraph(value);
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="cms-card-field cms-card-field--rich">
      <span className="cms-card-field-label">{label}</span>
      <div className="cms-card-rich-input">
        <RichTextToolbar
          editor={editor}
          onSave={() => onChange(sanitizeCmsHtml(editor?.getHTML() ?? ""))}
          onClear={
            onClear ??
            (() => {
              editor?.commands.clearContent(true);
              onChange("");
            })
          }
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
