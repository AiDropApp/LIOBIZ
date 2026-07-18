export type RichTextBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string };

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** Parse simple CMS text: `# h1` … `###### h6`, blank lines split paragraphs. */
export function parseCmsRichText(source?: string): RichTextBlock[] {
  if (!source?.trim()) return [];

  const blocks: RichTextBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraphLines = [];
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const headingMatch = line.trim().match(HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      const level = Math.min(6, headingMatch[1].length) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, text: headingMatch[2].trim() });
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraphLines.push(line);
  }

  flushParagraph();
  return blocks;
}

export const CMS_RICH_TEXT_HINT =
  "برای عنوان از # (h1) تا ###### (h6) در ابتدای خط استفاده کنید. خط خالی = پاراگراف جدید.";
