"use client";

import Link from "next/link";
import EditableText from "@/components/cms-edit/EditableText";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

type Props = {
  labelPath: string;
  hrefPath: string;
  label: string;
  href: string;
  className?: string;
  onClick?: () => void;
};

/** Button / CTA that stays editable in CMS mode (avoids Link swallowing clicks). */
export default function EditableCta({ labelPath, hrefPath, label, href, className = "btn-accent", onClick }: Props) {
  const cms = useCmsEdit();
  const edit = cms?.isAdmin && cms.editMode;

  if (edit) {
    return (
      <div className="cms-cta-edit-item inline-flex flex-col items-center gap-1">
        <EditableText path={labelPath} className={className} inline>
          {label}
        </EditableText>
        <EditableText path={hrefPath} dir="ltr" className="cms-cta-href">
          {href}
        </EditableText>
      </div>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}
