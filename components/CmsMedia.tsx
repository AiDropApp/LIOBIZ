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
import {
  blockMediaContextMenu,
  MEDIA_PROTECT_CLASS,
  protectedImageProps,
  protectedVideoProps,
} from "@/lib/media-protect";

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
  objectFit?: "cover" | "contain";
  natural?: boolean;
  controls?: boolean;
};

function ProtectWrap({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${MEDIA_PROTECT_CLASS}${className ? ` ${className}` : ""}`}
      onContextMenu={blockMediaContextMenu}
    >
      {children}
    </div>
  );
}

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
          <ProtectWrap className={`cms-media-natural ${wrapperClassName}`}>
            <iframe
              src={playable}
              title={alt}
              className="cms-media-natural-frame"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </ProtectWrap>
        );
      }
      return (
        <ProtectWrap className={`cms-media-natural ${wrapperClassName}`}>
          <video
            src={playable}
            poster={image || undefined}
            controls={controls}
            playsInline
            preload={controls ? "metadata" : "none"}
            aria-label={alt}
            className={`cms-media-natural-media ${videoClassName} ${className}`}
            {...protectedVideoProps}
          >
            {!controls ? (
              <track kind="captions" src="/captions/decorative-fa.vtt" label="بدون گفتار" srcLang="fa" default />
            ) : null}
          </video>
        </ProtectWrap>
      );
    }

    return (
      <ProtectWrap className={`cms-media-natural ${wrapperClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          className={`cms-media-natural-media ${className}`}
          {...protectedImageProps}
        />
      </ProtectWrap>
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
        <ProtectWrap className={`${wrapperBase} ${wrapperClassName}`}>
          <iframe
            src={playable}
            title={alt}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </ProtectWrap>
      );
    }
    return (
      <ProtectWrap className={`${wrapperBase} ${wrapperClassName}`}>
        <video
          src={playable}
          poster={image || undefined}
          autoPlay={!controls}
          muted={!controls}
          loop={!controls}
          controls={controls}
          playsInline
          preload={controls ? "metadata" : "none"}
          aria-label={alt}
          className={`absolute inset-0 h-full w-full ${fitClass} ${videoClassName} ${className}`}
          {...protectedVideoProps}
        >
          {!controls ? (
            <track kind="captions" src="/captions/decorative-fa.vtt" label="بدون گفتار" srcLang="fa" default />
          ) : null}
        </video>
      </ProtectWrap>
    );
  }

  if (fill) {
    return (
      <ProtectWrap className={`${wrapperBase} ${wrapperClassName}`}>
        <ContentImage
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`${fitClass} ${className}`}
          draggable={false}
          onContextMenu={blockMediaContextMenu}
        />
      </ProtectWrap>
    );
  }

  return (
    <ProtectWrap className={`${wrapperBase} ${wrapperClassName}`}>
      <ContentImage
        src={image}
        alt={alt}
        fill
        sizes={sizes || "100vw"}
        priority={priority}
        className={`${fitClass} ${className}`}
        draggable={false}
        onContextMenu={blockMediaContextMenu}
      />
    </ProtectWrap>
  );
}
