"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, Video } from "lucide-react";
import { isThumbCached, markThumbCached } from "@/lib/media-center/thumb-cache";
import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";

function previewUrl(entry: LibraryEntry, opts?: { thumb?: boolean }) {
  if (entry.previewUrl) return entry.previewUrl;
  if (entry.localPath) {
    const clean = entry.localPath
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    return `/media/${clean}`;
  }
  const qs = opts?.thumb ? "?thumb=1" : "";
  return `/api/admin/media/preview/${entry.id}${qs}`;
}

function useLazyVisible() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "280px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible]);

  return { ref, visible };
}

function PreviewSkeleton() {
  return <span className="admin-media-library-preview-skeleton" aria-hidden />;
}

function VideoPreview({ entry, active }: { entry: LibraryEntry; active: boolean }) {
  if (!active) return <PreviewSkeleton />;
  const src = previewUrl(entry);

  return (
    <>
      <video
        src={`${src}#t=0.1`}
        className="admin-media-library-preview"
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => markThumbCached(entry.id, false, true)}
      />
      <span className="admin-media-library-video-badge" aria-hidden>
        <Video size={14} />
      </span>
    </>
  );
}

function ImagePreview({ entry, active }: { entry: LibraryEntry; active: boolean }) {
  const local = Boolean(entry.previewUrl || entry.localPath);
  const [imageSrc, setImageSrc] = useState<string | null>(() =>
    active ? previewUrl(entry, { thumb: !local }) : null,
  );

  useEffect(() => {
    if (active && !imageSrc) setImageSrc(previewUrl(entry, { thumb: !local }));
  }, [active, entry, imageSrc, local]);

  if (!active) return <PreviewSkeleton />;

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={entry.name}
        className="admin-media-library-preview"
        loading="lazy"
        decoding="async"
        onLoad={() => markThumbCached(entry.id, imageSrc.includes("thumb=1"), true)}
        onError={() => {
          markThumbCached(entry.id, true, false);
          const full = previewUrl(entry);
          if (imageSrc !== full) setImageSrc(full);
          else markThumbCached(entry.id, false, false);
        }}
      />
    );
  }

  return <PreviewSkeleton />;
}

export default function LibraryFileThumb({ entry }: { entry: LibraryEntry }) {
  const { ref, visible } = useLazyVisible();
  const skipLazy =
    entry.type === "image" && (Boolean(entry.previewUrl || entry.localPath) || isThumbCached(entry.id, true));

  return (
    <div ref={ref} className="admin-media-library-preview-host">
      {entry.type === "video" ? (
        <VideoPreview entry={entry} active={visible} />
      ) : entry.type === "image" ? (
        <ImagePreview entry={entry} active={visible || skipLazy} />
      ) : (
        <span className="admin-media-library-preview-fallback">
          <FileImage size={28} />
        </span>
      )}
    </div>
  );
}
