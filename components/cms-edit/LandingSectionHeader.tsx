"use client";

import EditableText from "@/components/cms-edit/EditableText";
import CmsCardEditor, { type CardEditField } from "@/components/cms-edit/CmsCardEditor";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

type Props = {
  labelPath: string;
  titlePath: string;
  introPath?: string;
  label: string;
  title: string;
  intro?: string;
  className?: string;
  titleClassName?: string;
  introClassName?: string;
};

export default function LandingSectionHeader({
  labelPath,
  titlePath,
  introPath,
  label,
  title,
  intro,
  className = "mb-12 text-center",
  titleClassName = "section-title",
  introClassName = "mx-auto mt-4 max-w-2xl",
}: Props) {
  const cms = useCmsEdit();

  const fields: CardEditField[] = [
    { type: "richtext", path: labelPath, label: "برچسب بخش" },
    { type: "richtext", path: titlePath, label: "عنوان بخش" },
  ];
  if (introPath) {
    fields.push({ type: "richtext", path: introPath, label: "توضیح بخش" });
  }

  const body = (
    <div className={className}>
      <EditableText path={labelPath} className="section-label">
        {label}
      </EditableText>
      <EditableText path={titlePath} as="h2" className={`${titleClassName}`.trim()}>
        {title}
      </EditableText>
      {introPath ? (
        <EditableText path={introPath} as="div" className={introClassName}>
          {intro ?? ""}
        </EditableText>
      ) : null}
    </div>
  );

  if (cms?.isAdmin && cms.editMode) {
    return (
      <CmsCardEditor title={title} className="cms-section-header-wrap" fields={fields}>
        {body}
      </CmsCardEditor>
    );
  }

  return body;
}
