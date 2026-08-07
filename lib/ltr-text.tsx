import { Fragment, type ReactNode } from "react";

/** Split filesystem or breadcrumb paths into display segments. */
export function splitPathSegments(path: string): string[] {
  const normalized = path.replace(/\\/g, "/").trim();
  if (!normalized) return [];
  return normalized.split(/\s*[\/›]\s*/).filter(Boolean);
}

/** Paths that mix Latin folders (portfolio/) with Persian labels — each segment keeps its own direction. */
export function MixedPathLabel({
  path,
  className = "",
  title,
  separator = "/",
}: {
  path: string;
  className?: string;
  title?: string;
  separator?: string;
}) {
  const segments = splitPathSegments(path);
  if (segments.length === 0) return null;

  const full = path.replace(/\\/g, "/");

  return (
    <span className={`mixed-path-label ${className}`.trim()} dir="auto" title={title ?? full}>
      {segments.map((seg, i) => (
        <Fragment key={`${i}-${seg}`}>
          {i > 0 ? (
            <span className="mixed-path-sep" aria-hidden="true">
              {separator}
            </span>
          ) : null}
          <bdi>{seg}</bdi>
        </Fragment>
      ))}
    </span>
  );
}

/** Filenames or titles that may be Latin (UUID) or Persian depending on context. */
export function AutoDirText({
  children,
  className = "",
  title,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  as?: "span" | "strong" | "small" | "p" | "div";
}) {
  return (
    <Tag className={`auto-dir-text ${className}`.trim()} title={title}>
      <bdi>{children}</bdi>
    </Tag>
  );
}

/** Wrap Latin paths, filenames, sizes, URLs so they render correctly inside RTL UI. */
export function LtrIsolate({
  children,
  className = "",
  title,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  as?: "span" | "strong" | "small" | "p" | "div";
}) {
  return (
    <Tag className={`ltr-isolate ${className}`.trim()} dir="ltr" title={title}>
      <bdi>{children}</bdi>
    </Tag>
  );
}

export function formatFileSizeLabel(size?: number, fallbackType?: string): string {
  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (fallbackType === "image") return "تصویر";
  if (fallbackType === "video") return "ویدیو";
  return "فایل";
}

export function formatPathLabel(path?: string | null): string | null {
  if (!path?.trim()) return null;
  return path.replace(/\\/g, "/");
}
