import { describe, expect, it } from "vitest";
import {
  buildSegmentAliasesFromPathPairs,
  mergeSectionAliases,
  patchLocalMapPaths,
  translateStoredPath,
} from "@/lib/media-center/folder-rename";

describe("folder-rename", () => {
  it("learns aliases from disk/canonical path pairs", () => {
    const aliases = buildSegmentAliasesFromPathPairs([
      {
        diskPath: "portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/a.jpg",
        canonicalPath: "portfolio/گرافیک/لوگو/a.jpg",
      },
      {
        diskPath: "portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/b.jpg",
        canonicalPath: "portfolio/گرافیک/لوگو/b.jpg",
      },
    ]);
    expect(aliases.get("┌»╪▒╪º┘ü█î┌⌐")).toBe("گرافیک");
    expect(aliases.get("┘ä┘ê┌»┘ê")).toBe("لوگو");
  });

  it("merges section aliases without conflict", () => {
    const bySection = new Map([
      ["portfolio" as const, new Map([["┌»╪▒╪º┘ü█î┌⌐", "گرافیک"]])],
      ["blog" as const, new Map([["old-blog", "بلاگ"]])],
    ]);
    const merged = mergeSectionAliases(bySection);
    expect(merged.get("┌»╪▒╪º┘ü█î┌⌐")).toBe("گرافیک");
    expect(merged.get("old-blog")).toBe("بلاگ");
  });

  it("translates stored paths with alias map", () => {
    const aliases = new Map([
      ["┌»╪▒╪º┘ü█î┌⌐", "گرافیک"],
      ["┘ä┘ê┌»┘ê", "لوگو"],
    ]);
    expect(translateStoredPath("portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/a.jpg", aliases)).toBe(
      "portfolio/گرافیک/لوگو/a.jpg",
    );
  });

  it("patches local map entries", () => {
    const aliases = new Map([["┌»╪▒╪º┘ü█î┌⌐", "گرافیک"]]);
    const map = {
      version: 1 as const,
      updatedAt: "",
      entries: {
        "1": {
          localPath: "portfolio/┌»╪▒╪º┘ü█î┌⌐/x.jpg",
          fileName: "x.jpg",
          kind: "image" as const,
          folderPath: "portfolio/┌»╪▒╪º┘ü█î┌⌐",
        },
      },
    };
    const n = patchLocalMapPaths(map, aliases);
    expect(n).toBe(1);
    expect(map.entries["1"].localPath).toBe("portfolio/گرافیک/x.jpg");
    expect(map.entries["1"].folderPath).toBe("portfolio/گرافیک");
  });
});
