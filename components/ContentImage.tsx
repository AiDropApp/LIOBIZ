"use client";

import Image, { type ImageProps } from "next/image";
import { isDirectVideoFileUrl, isVideoUrl } from "@/lib/media-types";

type Props = Omit<ImageProps, "src"> & {
  src: string;
};

/** Uploaded files and SVGs skip Next optimizer (avoids sharp 400s). */
export default function ContentImage({ src, alt, unoptimized, ...rest }: Props) {
  const safeSrc = src?.trim();
  if (!safeSrc) return null;

  // next/image only supports images — videos must use CmsMedia or native <video>.
  if (isVideoUrl(safeSrc) || isDirectVideoFileUrl(safeSrc)) return null;

  const skipOptimizer =
    safeSrc.startsWith("/uploads/") ||
    safeSrc.startsWith("/media/") ||
    safeSrc.startsWith("/video/") ||
    safeSrc.startsWith("/api/media/") ||
    safeSrc.startsWith("http://") ||
    safeSrc.startsWith("https://") ||
    safeSrc.endsWith(".svg") ||
    safeSrc.startsWith("data:");

  return <Image src={safeSrc} alt={alt} unoptimized={skipOptimizer || Boolean(unoptimized)} {...rest} />;
}
