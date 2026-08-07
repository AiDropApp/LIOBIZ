"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LandingContent } from "@/lib/cms-defaults";
import { defaultLanding } from "@/lib/cms-defaults";
import { getByPath, setByPath } from "@/lib/cms-field-path";
import type { SiteContent } from "@/lib/content-store";

type CmsEditContextValue = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  landing: LandingContent;
  content: SiteContent | null;
  getField: (path: string, fallback?: string) => string;
  updateLocal: (path: string, value: unknown) => void;
  saveField: (path: string, value?: unknown) => Promise<boolean>;
  saving: boolean;
  toast: string;
};

const CmsEditContext = createContext<CmsEditContextValue | null>(null);

export function useCmsEdit() {
  return useContext(CmsEditContext);
}

export function useCmsEditRequired() {
  const ctx = useCmsEdit();
  if (!ctx) throw new Error("CmsEditProvider missing");
  return ctx;
}

type Props = {
  children: ReactNode;
  initialLanding?: LandingContent;
  enabled?: boolean;
  /** Resolved on server — avoids /api/auth/me for anonymous visitors */
  initialIsAdmin?: boolean;
  /** SSR site content — avoids client fetch + hydration drift for guests */
  initialContent?: SiteContent | null;
};

export default function CmsEditProvider({
  children,
  initialLanding,
  enabled = true,
  initialIsAdmin = false,
  initialContent = null,
}: Props) {
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(initialContent);
  const [landing, setLanding] = useState<LandingContent>(() => {
    if (initialContent?.landing) {
      return { ...defaultLanding, ...initialContent.landing };
    }
    return initialLanding ?? defaultLanding;
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!enabled) return;
    setIsAdmin(initialIsAdmin);
  }, [enabled, initialIsAdmin]);

  useEffect(() => {
    if (!enabled || !initialIsAdmin) return;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setContent(data);
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, [enabled, initialIsAdmin]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const updateLocal = useCallback((path: string, value: unknown) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = setByPath(prev, path, value);
      if (next.landing) setLanding({ ...defaultLanding, ...next.landing });
      return next;
    });
  }, []);

  const saveField = useCallback(
    async (path: string, value?: unknown) => {
      const resolved =
        value !== undefined
          ? value
          : content
            ? getByPath(content, path)
            : "";

      setSaving(true);
      try {
        const res = await fetch("/api/content/cms/field", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, value: resolved }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "خطا در ذخیره");
        setContent(data.content);
        if (data.content?.landing) setLanding({ ...defaultLanding, ...data.content.landing });
        flash("ذخیره شد");
        return true;
      } catch (e) {
        flash(e instanceof Error ? e.message : "خطا در ذخیره");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [content, flash],
  );

  const getField = useCallback(
    (path: string, fallback = "") => {
      if (content) {
        const v = getByPath(content, path);
        if (typeof v === "string" && v.trim()) return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
      }
      if (path.startsWith("landing.")) {
        const key = path.replace("landing.", "") as keyof LandingContent;
        const fromLanding = landing[key];
        if (typeof fromLanding === "string" && fromLanding.trim()) return fromLanding;
      }
      return fallback;
    },
    [content, landing],
  );

  const value = useMemo(
    () => ({
      isAdmin,
      editMode,
      setEditMode,
      landing,
      content,
      getField,
      updateLocal,
      saveField,
      saving,
      toast,
    }),
    [isAdmin, editMode, landing, content, getField, updateLocal, saveField, saving, toast],
  );

  return (
    <CmsEditContext.Provider value={value}>
      {children}
      {enabled && isAdmin && toast ? <div className="cms-edit-toast">{toast}</div> : null}
    </CmsEditContext.Provider>
  );
}
