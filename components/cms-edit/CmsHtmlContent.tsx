"use client";

import { isHtmlContent, sanitizeCmsHtml } from "@/lib/cms-html";
import CmsRichText from "@/components/CmsRichText";

type Props = {
  content?: string;
  className?: string;
  paragraphClassName?: string;
};

/** Renders CMS field as sanitized HTML or legacy markdown. */
export default function CmsHtmlContent({ content, className = "", paragraphClassName }: Props) {
  if (!content?.trim()) return null;

  if (isHtmlContent(content)) {
    return (
      <div
        className={`cms-html-content ${className}`.trim()}
        dir="auto"
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content) }}
      />
    );
  }

  return (
    <CmsRichText
      content={content}
      className={className}
      paragraphClassName={paragraphClassName || "text-muted leading-8"}
    />
  );
}
