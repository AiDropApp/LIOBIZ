"use client";

import CmsRichTextField from "@/components/cms-edit/CmsRichTextField";

type Props = {
  path: string;
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  dir?: "rtl" | "ltr" | "auto";
  /** @deprecated Rich-text modal supports multiline for all fields */
  multiline?: boolean;
  /** Inline layout for button / nav labels */
  inline?: boolean;
};

export default function EditableText({
  path,
  children,
  className = "",
  as = "span",
  dir = "rtl",
  inline,
}: Props) {
  const fallback = String(children ?? "");
  const useInline = inline ?? as === "span";

  return (
    <CmsRichTextField
      path={path}
      fallback={fallback}
      className={className}
      as={as}
      dir={dir}
      inline={useInline}
    />
  );
}
