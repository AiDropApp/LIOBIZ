"use client";

import ContentImage from "@/components/ContentImage";
import {
  aspectRatioClass,
  resolveMediaKind,
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
}: Props) {
  const kind = resolveMediaKind({ mediaKind, videoSrc });
  const aspect = fitParent ? "" : aspectRatioClass(aspectRatio);
  const wrapperBase = fitParent
    ? "absolute inset-0 h-full w-full overflow-hidden"
    : `relative overflow-hidden ${aspect}`;

  if (kind === "video" && videoSrc) {
    return (
      <div className={`${wrapperBase} ${wrapperClassName}`}>
        <video
          src={videoSrc}
          poster={image || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          className={`absolute inset-0 h-full w-full object-cover ${videoClassName} ${className}`}
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
          className={`object-cover ${className}`}
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
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    </div>
  );
}
