"use client";

import CmsEditProvider from "@/components/cms-edit/CmsEditProvider";
import CmsEditToolbar from "@/components/cms-edit/CmsEditToolbar";
import type { LandingContent } from "@/lib/cms-defaults";
import type { SiteContent } from "@/lib/content-store";
import "@/components/cms-edit/cms-edit.css";

export default function CmsEditShell({
  children,
  initialLanding,
  initialIsAdmin = false,
  initialContent = null,
}: {
  children: React.ReactNode;
  initialLanding?: LandingContent;
  initialIsAdmin?: boolean;
  initialContent?: SiteContent | null;
}) {
  return (
    <CmsEditProvider
      initialLanding={initialLanding}
      initialIsAdmin={initialIsAdmin}
      initialContent={initialContent}
      enabled
    >
      <CmsEditToolbar />
      {children}
    </CmsEditProvider>
  );
}
