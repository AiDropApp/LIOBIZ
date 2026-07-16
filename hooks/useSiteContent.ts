"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content-store";

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, []);

  return { content, loading, reload: () => {
    setLoading(true);
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setContent(data))
      .finally(() => setLoading(false));
  }};
}

export function useLandingSection<K extends keyof SiteContent>(key: K, fallback: SiteContent[K]) {
  const { content } = useSiteContent();
  if (!content) return fallback;
  return (content[key] ?? fallback) as SiteContent[K];
}
