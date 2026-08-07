"use client";

import { useEffect, useState } from "react";
import { useHomeDataOptional } from "@/components/HomeDataProvider";
import { useCmsEdit } from "@/components/cms-edit/CmsEditProvider";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";

/** Landing copy for homepage sections — prefers single HomeDataProvider payload over per-section props. */
export function useHomeLanding(initialLanding?: LandingContent): LandingContent {
  const home = useHomeDataOptional();
  const cms = useCmsEdit();
  const [landing, setLanding] = useState<LandingContent>(
    home?.landing ?? initialLanding ?? defaultLanding,
  );

  useEffect(() => {
    if (home?.landing || initialLanding || cms?.landing) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, [cms?.landing, home?.landing, initialLanding]);

  return cms?.landing ?? home?.landing ?? landing;
}
