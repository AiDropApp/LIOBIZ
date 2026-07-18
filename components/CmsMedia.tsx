"use client";

import ContentImage from "@/components/ContentImage";
import {
  aspectRatioClass,
  needsIframeVideoEmbed,
  resolveMediaKind,
  toPlayableVideoUrl,
  type MediaAspect,
  type MediaKind,
} from "@/lib/media-types";

type Props = {
  image: string;
  alt: string;
  videoSrc?: string;
  mediaKind?: MediaKind;
  aspectRatio?: MediaAspect;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  videoClassName?: string;
  wrapperClassName?: string;
  fitParent?: boolean;
  /** Cover crop for cards; contain/natural for detail preview */
  objectFit?: "cover" | "contain";
  /** Show media at its intrinsic size inside the preview (detail modal) */
  natural?: boolean;
  controls?: boolean;
};

export default function CmsMedia({
  image,
  alt,
  videoSrc,
  mediaKind,
  aspectRatio = "portrait",
  fill = false,
  sizes,
  priority,
  className = "",
  videoClassName = "",
  wrapperClassName = "",
  fitParent = false,
  objectFit = "cover",
  natural = false,
  controls = false,
}: Props) {
  const kind = resolveMediaKind({ mediaKind, videoSrc });
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  if (natural) {
    if (kind === "video" && videoSrc) {
      const playable = toPlayableVideoUrl(videoSrc);
      if (needsIframeVideoEmbed(videoSrc)) {
        return (
          <div className={`cms-media-natural ${wrapperClassName}`}>
            <iframe
              src={playable}
              title={alt}
              className="cms-media-natural-frame"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        );
      }
      return (
        <div className={`cms-media-natural ${wrapperClassName}`}>
          <video
            src={playable}
            poster={image || undefined}
            controls={controls}
            playsInline
            preload="metadata"
            aria-label={alt}
            className={`cms-media-natural-media ${videoClassName} ${className}`}
          />
        </div>
      );
    }

    return (
      <div className={`cms-media-natural ${wrapperClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} className={`cms-media-natural-media ${className}`} />
      </div>
    );
  }

  const aspect = fitParent ? "" : aspectRatioClass(aspectRatio);
  const wrapperBase = fitParent
    ? "absolute inset-0 h-full w-full overflow-hidden"
    : `relative overflow-hidden ${aspect}`;

  if (kind === "video" && videoSrc) {
    const playable = toPlayableVideoUrl(videoSrc);
    if (needsIframeVideoEmbed(videoSrc)) {
      return (
        <div className={`${wrapperBase} ${wrapperClassName}`}>
          <iframe
            src={playable}
            title={alt}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      );
    }
    return (
      <div className={`${wrapperBase} ${wrapperClassName}`}>
        <video
          src={playable}
          poster={image || undefined}
          autoPlay={!controls}
          muted={!controls}
          loop={!controls}
          controls={controls}
          playsInline
          preload="metadata"
          aria-label={alt}
          className={`absolute inset-0 h-full w-full ${fitClass} ${videoClassName} ${className}`}
        />
      </div>
    );
  }

  if (fill) {
    return (
      <div className={`${wrapperBase} ${wrapperClassName}`}>
        <ContentImage
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`${fitClass} ${className}`}
        />
      </div>
    );
  }

  return (
    <div className={`${wrapperBase} ${wrapperClassName}`}>
      <ContentImage
        src={image}
        alt={alt}
        fill
        sizes={sizes || "100vw"}
        priority={priority}
        className={`${fitClass} ${className}`}
      />
    </div>
  );
}
