import { createElement } from "react";
import { parseCmsRichText } from "@/lib/cms-rich-text";
import { needsIframeVideoEmbed, toPlayableVideoUrl } from "@/lib/media-types";
import { sanitizePublicUrl } from "@/lib/safe-url";
import {
  blockMediaContextMenu,
  MEDIA_PROTECT_CLASS,
  protectedImageProps,
  protectedVideoProps,
} from "@/lib/media-protect";

type Props = {
  content?: string;
  className?: string;
  paragraphClassName?: string;
  headingClassName?: string;
};

const HEADING_CLASS: Record<number, string> = {
  1: "cms-rich-h1",
  2: "cms-rich-h2",
  3: "cms-rich-h3",
  4: "cms-rich-h4",
  5: "cms-rich-h5",
  6: "cms-rich-h6",
};

export default function CmsRichText({
  content,
  className = "",
  paragraphClassName = "text-muted leading-8",
  headingClassName = "",
}: Props) {
  const blocks = parseCmsRichText(content);
  if (blocks.length === 0) return null;

  return (
    <div className={`cms-rich-text ${className}`.trim()}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const levelClass = HEADING_CLASS[block.level] || "cms-rich-h3";
          return createElement(
            `h${block.level}`,
            {
              key: `h-${index}`,
              className: `${levelClass} ${headingClassName}`.trim(),
            },
            block.text,
          );
        }
        if (block.type === "image") {
          const src = sanitizePublicUrl(block.src);
          if (!src) return null;
          return (
            <figure
              key={`img-${index}`}
              className={`cms-rich-media my-6 ${MEDIA_PROTECT_CLASS}`}
              onContextMenu={blockMediaContextMenu}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={block.alt}
                className="w-full rounded-xl object-cover"
                loading="lazy"
                {...protectedImageProps}
              />
            </figure>
          );
        }
        if (block.type === "link") {
          const href = sanitizePublicUrl(block.href);
          if (!href) {
            return (
              <p key={`link-${index}`} className={paragraphClassName}>
                {block.text}
              </p>
            );
          }
          return (
            <p key={`link-${index}`} className={paragraphClassName}>
              <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
                {block.text}
              </a>
            </p>
          );
        }
        if (block.type === "audio") {
          const src = sanitizePublicUrl(block.src);
          if (!src) return null;
          return (
            <div key={`aud-${index}`} className="cms-rich-media my-6">
              <audio src={src} controls preload="metadata" className="w-full" />
            </div>
          );
        }
        if (block.type === "video") {
          const safeSrc = sanitizePublicUrl(block.src);
          if (!safeSrc) return null;
          const src = toPlayableVideoUrl(safeSrc);
          if (needsIframeVideoEmbed(safeSrc)) {
            return (
              <div
                key={`vid-${index}`}
                className={`cms-rich-media my-6 aspect-video overflow-hidden rounded-xl ${MEDIA_PROTECT_CLASS}`}
                onContextMenu={blockMediaContextMenu}
              >
                <iframe
                  src={src}
                  title="ویدیو"
                  className="h-full w-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            );
          }
          return (
            <div
              key={`vid-${index}`}
              className={`cms-rich-media my-6 overflow-hidden rounded-xl ${MEDIA_PROTECT_CLASS}`}
              onContextMenu={blockMediaContextMenu}
            >
              <video
                src={src}
                controls
                playsInline
                preload="metadata"
                className="w-full"
                {...protectedVideoProps}
              />
            </div>
          );
        }
        return (
          <p key={`p-${index}`} className={paragraphClassName}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
