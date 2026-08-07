"use client";

import EditableText from "@/components/cms-edit/EditableText";
import EditableRichText from "@/components/cms-edit/EditableRichText";
import EditableCta from "@/components/cms-edit/EditableCta";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";

type Props = {
  labelPath: string;
  titlePath: string;
  introPath?: string;
  label: string;
  title: string;
  intro?: string;
};

export default function EditablePageHero({ labelPath, titlePath, introPath, label, title, intro }: Props) {
  const cms = useCmsEdit();
  const backLabel = cms?.getField("pages.common.backToHome", "بازگشت به صفحه اصلی") ?? "بازگشت به صفحه اصلی";
  const backHref = cms?.getField("pages.common.backToHomeHref", "/") ?? "/";

  return (
    <div className="page-hero mb-12 text-center lg:mb-16">
      <EditableText path={labelPath} className="section-label">
        {label}
      </EditableText>
      <EditableText path={titlePath} as="h1" className="section-title mx-auto max-w-4xl">
        {title}
      </EditableText>
      {introPath ? (
        <EditableRichText
          path={introPath}
          className="mx-auto mt-5 max-w-2xl"
          paragraphClassName="leading-relaxed text-muted"
        />
      ) : intro ? (
        <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted">{intro}</p>
      ) : null}
      <div className="mt-6 flex justify-center">
        <EditableCta
          labelPath="pages.common.backToHome"
          hrefPath="pages.common.backToHomeHref"
          label={backLabel}
          href={backHref}
          className="text-sm text-muted transition-colors hover:text-primary"
        />
      </div>
    </div>
  );
}
