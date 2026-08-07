"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import EditableText from "@/components/cms-edit/EditableText";
import ContactForm from "@/components/ContactForm";
import type { PagesContent, SiteInfo } from "@/lib/content-store";

type Props = {
  contact: PagesContent["contact"];
  site: SiteInfo;
};

export default function ContactPageContent({ contact, site }: Props) {
  return (
    <>
      <EditablePageHero
        labelPath="pages.contact.label"
        titlePath="pages.contact.title"
        introPath="pages.contact.intro"
        label={contact.label}
        title={contact.title}
        intro={contact.intro}
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <div className="space-y-4">
          <a
            href={`tel:${site.phone.replace(/\s/g, "")}`}
            className="contact-info-card lux-card cms-editable-card flex items-start gap-4"
          >
            <div className="contact-info-icon" aria-hidden="true">
              <Phone size={20} />
            </div>
            <div>
              <h2 className="mb-1 font-bold">
                <EditableText path="pages.contact.phoneLabel">{contact.phoneLabel}</EditableText>
              </h2>
              <EditableText path="site.phone" dir="ltr" className="text-muted">
                {site.phone}
              </EditableText>
            </div>
          </a>

          <a
            href={`mailto:${site.email}`}
            className="contact-info-card lux-card cms-editable-card flex items-start gap-4"
          >
            <div className="contact-info-icon" aria-hidden="true">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="mb-1 font-bold">
                <EditableText path="pages.contact.emailLabel">{contact.emailLabel}</EditableText>
              </h2>
              <EditableText path="site.email" dir="ltr" className="text-muted">
                {site.email}
              </EditableText>
            </div>
          </a>

          <div className="contact-info-card lux-card cms-editable-card flex items-start gap-4">
            <div className="contact-info-icon" aria-hidden="true">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="mb-1 font-bold">
                <EditableText path="pages.contact.addressLabel">{contact.addressLabel}</EditableText>
              </h2>
              <EditableText path="site.address" as="p" className="text-muted" multiline>
                {site.address}
              </EditableText>
              <EditableText path="pages.contact.hours" as="p" className="mt-2 text-sm text-muted">
                {contact.hours}
              </EditableText>
            </div>
          </div>
        </div>

        <ContactForm
          labels={{
            formTitle: contact.formTitle,
            formIntro: contact.formIntro,
            nameLabel: contact.nameLabel,
            messageLabel: contact.messageLabel,
            submitLabel: contact.submitLabel,
          }}
        />
      </div>
    </>
  );
}
