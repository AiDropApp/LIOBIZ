import { createElement } from "react";
import { parseCmsRichText } from "@/lib/cms-rich-text";
import { needsIframeVideoEmbed, toPlayableVideoUrl } from "@/lib/media-types";

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
          return (
            <figure key={`img-${index}`} className="cms-rich-media my-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full rounded-xl object-cover" loading="lazy" />
            </figure>
          );
        }
        if (block.type === "video") {
          const src = toPlayableVideoUrl(block.src);
          if (needsIframeVideoEmbed(block.src)) {
            return (
              <div key={`vid-${index}`} className="cms-rich-media my-6 aspect-video overflow-hidden rounded-xl">
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
            <div key={`vid-${index}`} className="cms-rich-media my-6 overflow-hidden rounded-xl">
              <video src={src} controls playsInline preload="metadata" className="w-full" />
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
