"use client";

import { useState } from "react";
import { Image as ImageIcon, Video } from "lucide-react";
import type { MediaCard } from "@/lib/filesir/types";
import {
  adminAssetPreviewUrl,
  adminVideoPreviewUrl,
  getCardCoverRef,
  getCardVideoRef,
} from "@/lib/media-center/preview-url";

type Props = {
  card: MediaCard;
  draft?: boolean;
};

function useCoverSrc(coverRef: ReturnType<typeof getCardCoverRef>) {
  const thumb = coverRef ? adminAssetPreviewUrl(coverRef, { thumb: true }) : null;
  const full = coverRef ? adminAssetPreviewUrl(coverRef, { thumb: false }) : null;
  const [src, setSrc] = useState(thumb);

  const onError = () => {
    if (full && src !== full) setSrc(full);
  };

  return { src, onError };
}

export default function AdminMediaCardThumb({ card, draft }: Props) {
  const coverRef = getCardCoverRef(card);
  const videoRef = getCardVideoRef(card);
  const { src: coverSrc, onError: onCoverError } = useCoverSrc(coverRef);
  const videoSrc = adminVideoPreviewUrl(videoRef);

  return (
    <div className={`admin-media-card-thumb${coverSrc && videoSrc ? " admin-media-card-thumb--dual" : ""}`}>
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt=""
          className="admin-media-card-cover"
          onError={onCoverError}
        />
      ) : videoSrc ? (
        <video
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="admin-media-card-video-main"
        />
      ) : (
        <span className="admin-media-card-placeholder">
          {videoRef ? <Video size={28} /> : <ImageIcon size={28} />}
        </span>
      )}

      {coverSrc && videoSrc && (
        <div className="admin-media-card-video-mini" title="ویدیو">
          <video src={videoSrc} muted loop playsInline autoPlay preload="metadata" />
          <span className="admin-media-card-video-badge">
            <Video size={12} />
          </span>
        </div>
      )}

      {draft && <span className="admin-media-draft">پیش‌نویس</span>}
    </div>
  );
}

function AssetPreviewImage({ asset }: { asset: NonNullable<MediaCard["cover"]> }) {
  const thumb = adminAssetPreviewUrl(asset, { thumb: true });
  const full = adminAssetPreviewUrl(asset, { thumb: false });
  const [src, setSrc] = useState(thumb);

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => {
        if (full && src !== full) setSrc(full);
      }}
    />
  );
}

export function AdminAssetPreview({
  asset,
  label,
}: {
  asset?: MediaCard["cover"];
  label: string;
}) {
  if (!asset?.entryId) return null;

  const isVideo = asset.kind === "video";
  const videoSrc = isVideo ? adminVideoPreviewUrl(asset) : null;

  return (
    <div className="admin-media-asset-preview">
      <span className="admin-media-asset-preview-label">{label}</span>
      <div className="admin-media-asset-preview-frame">
        {videoSrc ? (
          <video src={videoSrc} muted loop playsInline autoPlay preload="metadata" />
        ) : (
          <AssetPreviewImage asset={asset} />
        )}
      </div>
    </div>
  );
}
