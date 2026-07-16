"use client";

import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src"> & {
  src: string;
};

/** Uploaded files and SVGs skip Next optimizer (avoids sharp 400s). */
export default function ContentImage({ src, alt, unoptimized, ...rest }: Props) {
  const skipOptimizer =
    src.startsWith("/uploads/") ||
    src.startsWith("/api/media/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.endsWith(".svg") ||
    src.startsWith("data:");

  return <Image src={src} alt={alt} unoptimized={skipOptimizer || Boolean(unoptimized)} {...rest} />;
}
