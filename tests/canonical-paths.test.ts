import { describe, expect, it } from "vitest";
import {
  buildSegmentAliasMap,
  displayFolderLabel,
  resolveCanonicalLocalPath,
  translateDiskPath,
} from "@/lib/media-center/canonical-paths";
import type { MediaCategory } from "@/lib/filesir/types";

const categories: MediaCategory[] = [
  {
    id: "cat-graphic",
    createdAt: "2026-01-01T00:00:00.000Z",
    section: "portfolio",
    name: "گرافیک",
    slug: "graphic",
    folderId: 1,
    sortOrder: 0,
  },
  {
    id: "cat-logo",
    createdAt: "2026-01-01T00:00:00.000Z",
    section: "portfolio",
    name: "لوگو",
    slug: "logo",
    folderId: 2,
    parentId: "cat-graphic",
    sortOrder: 0,
  },
];

describe("canonical-paths", () => {
  it("translates mojibake disk segments via alias map", () => {
    const aliases = new Map([
      ["┌»╪▒╪º┘ü█î┌⌐", "گرافیک"],
      ["┘ä┘ê┌»┘ê", "لوگو"],
    ]);
    expect(translateDiskPath("portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/file.jpg", aliases)).toBe(
      "portfolio/گرافیک/لوگو/file.jpg",
    );
  });

  it("builds display label from canonical path", () => {
    const label = displayFolderLabel(categories, "portfolio/گرافیک/لوگو/00566a07.jpg");
    expect(label).toBe("گرافیک › لوگو");
  });

  it("prefers map basename over disk path", () => {
    const canonical = resolveCanonicalLocalPath({
      diskPath: "portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/00566a07.jpg",
      fileName: "00566a07-d837-425a-94ec-2d09c398eda3.jpg",
      byBasenameMap: new Map([
        [
          "00566a07-d837-425a-94ec-2d09c398eda3.jpg",
          {
            localPath: "portfolio/گرافیک/لوگو/00566a07-d837-425a-94ec-2d09c398eda3.jpg",
            fileName: "00566a07-d837-425a-94ec-2d09c398eda3.jpg",
            kind: "image",
          },
        ],
      ]),
      byBasenameCard: new Map(),
      aliases: new Map(),
    });
    expect(canonical).toBe("portfolio/گرافیک/لوگو/00566a07-d837-425a-94ec-2d09c398eda3.jpg");
  });

  it("pairs disk and category folders by file counts", () => {
    const diskFolders = [{ main: "┌»╪▒╪º┘ü█î┌⌐", subs: ["┘ä┘ê┌»┘ê"] }];
    const diskPaths = ["portfolio/┌»╪▒╪º┘ü█î┌⌐/┘ä┘ê┌»┘ê/a.jpg", "portfolio/┌»╪▒╪º┘ü█î┌⌐/b.jpg"];
    const canonicalPaths = ["portfolio/گرافیک/لوگو/x.jpg", "portfolio/گرافیک/y.jpg"];
    const aliases = buildSegmentAliasMap(
      "portfolio",
      categories,
      diskFolders,
      diskPaths,
      canonicalPaths,
    );
    expect(aliases.get("┌»╪▒╪º┘ü█î┌⌐")).toBe("گرافیک");
  });
});
