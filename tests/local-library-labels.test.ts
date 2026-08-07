import { describe, expect, it } from "vitest";
import { listLocalMediaFlat } from "@/lib/media-center/local-library";
import { isCorruptedLabel } from "@/lib/text-sanitize";

describe("listLocalMediaFlat disk paths after folder fix", () => {
  it("reads clean UTF-8 folder names directly from disk", async () => {
    const entries = await listLocalMediaFlat({ section: "portfolio" });
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries.slice(0, 30)) {
      expect(isCorruptedLabel(entry.folderLabel!), entry.localPath).toBe(false);
      expect(isCorruptedLabel(entry.localPath), entry.localPath).toBe(false);
    }
  });
});
