import { createElement } from "react";
import { parseCmsRichText } from "@/lib/cms-rich-text";

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
        return (
          <p key={`p-${index}`} className={paragraphClassName}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
