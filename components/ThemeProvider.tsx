"use client";

import { useEffect, useState } from "react";
import type { ThemeSettings } from "@/lib/content-store";

const SCALE: Record<ThemeSettings["headingScale"], string> = {
  sm: "0.92",
  md: "1",
  lg: "1.12",
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const theme = data?.theme as ThemeSettings | undefined;
        if (theme?.primaryColor) {
          document.documentElement.style.setProperty("--primary", theme.primaryColor);
          document.documentElement.style.setProperty("--primary-dark", theme.primaryColor);
          document.documentElement.style.setProperty("--color-primary", theme.primaryColor);
        }
        if (theme?.headingScale) {
          document.documentElement.style.setProperty(
            "--heading-scale",
            SCALE[theme.headingScale] || "1",
          );
        }
      })
      .finally(() => setReady(true));
  }, []);

  return <div data-theme-ready={ready ? "1" : "0"}>{children}</div>;
}
