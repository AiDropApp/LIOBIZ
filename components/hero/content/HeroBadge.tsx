"use client";

import EditableText from "@/components/cms-edit/EditableText";

export default function HeroBadge({ text }: { text?: string }) {
  return (
    <EditableText path="landing.heroBadge" className="hero-badge">
      {text || "آژانس رشد کسب‌وکار"}
    </EditableText>
  );
}
