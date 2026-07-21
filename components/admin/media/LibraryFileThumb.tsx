"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, Video } from "lucide-react";
import { isThumbCached, markThumbCached } from "@/lib/media-center/thumb-cache";
import type { LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";

function previewUrl(entryId: number, opts?: { thumb?: boolean }) {
  const qs = opts?.thumb ? "?thumb=1" : "";
  return `/api/admin/media/preview/${entryId}${qs}`;
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

function VideoPreview({ entryId, active }: { entryId: number; active: boolean }) {
  if (!active) return <PreviewSkeleton />;

  return (
    <>
      <video
        src={`${previewUrl(entryId)}#t=0.1`}
        className="admin-media-library-preview"
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => markThumbCached(entryId, false, true)}
      />
      <span className="admin-media-library-video-badge" aria-hidden>
        <Video size={14} />
      </span>
    </>
  );
}

function ImagePreview({ entryId, name, active }: { entryId: number; name: string; active: boolean }) {
  const [imageSrc, setImageSrc] = useState<string | null>(() =>
    active ? previewUrl(entryId, { thumb: true }) : null,
  );

  useEffect(() => {
    if (active && !imageSrc) setImageSrc(previewUrl(entryId, { thumb: true }));
  }, [active, entryId, imageSrc]);

  if (!active) return <PreviewSkeleton />;

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={name}
        className="admin-media-library-preview"
        loading="lazy"
        decoding="async"
        onLoad={() => markThumbCached(entryId, imageSrc.includes("thumb=1"), true)}
        onError={() => {
          markThumbCached(entryId, true, false);
          const full = previewUrl(entryId);
          if (imageSrc !== full) setImageSrc(full);
          else markThumbCached(entryId, false, false);
        }}
      />
    );
  }

  return <PreviewSkeleton />;
}

export default function LibraryFileThumb({ entry }: { entry: LibraryEntry }) {
  const { ref, visible } = useLazyVisible();
  const skipLazy = entry.type === "image" && isThumbCached(entry.id, true);

  return (
    <div ref={ref} className="admin-media-library-preview-host">
      {entry.type === "video" ? (
        <VideoPreview entryId={entry.id} active={visible} />
      ) : entry.type === "image" ? (
        <ImagePreview entryId={entry.id} name={entry.name} active={visible || skipLazy} />
      ) : (
        <span className="admin-media-library-preview-fallback">
          <FileImage size={28} />
        </span>
      )}
    </div>
  );
}
