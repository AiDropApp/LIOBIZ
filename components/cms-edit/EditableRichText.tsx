"use client";

import CmsRichTextField from "@/components/cms-edit/CmsRichTextField";

type Props = {
  path: string;
  className?: string;
  paragraphClassName?: string;
  fallback?: string;
};

export default function EditableRichText({ path, className = "", paragraphClassName, fallback = "" }: Props) {
  return (
    <CmsRichTextField
      path={path}
      fallback={fallback}
      className={className}
      paragraphClassName={paragraphClassName}
      as="div"
    />
  );
}
