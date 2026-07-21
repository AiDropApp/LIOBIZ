import { describe, it, expect } from "vitest";
import {
  collectSectionFolderIds,
  folderLabelForId,
} from "@/lib/media-center/library-entries";
import { collectOrphanCategoryIds } from "@/lib/media-center/category-sync";
import { findCardsWithMissingMyFileEntries } from "@/lib/media-center/sync-prune";
import type { MediaCard } from "@/lib/filesir/types";
import { mediaCategoriesToPortfolio, applyMediaCenterToSiteContent } from "@/lib/media-center/public";
import type { MediaCenterStore } from "@/lib/filesir/types";

const store: MediaCenterStore = {
  version: 1,
  rootFolderId: 1000,
  sectionFolderIds: {
    portfolio: 2296586,
    backstage: 2296587,
    "creative-partners": 2296588,
    blog: 2296589,
  },
  categories: [
    {
      id: "cat-portfolio-motion",
      createdAt: "2026-01-01T00:00:00.000Z",
      section: "portfolio",
      name: "موشن گرافیک",
      slug: "motion",
      folderId: 2265330,
      sortOrder: 0,
    },
    {
      id: "cat-portfolio-photo",
      createdAt: "2026-01-01T00:00:00.000Z",
      section: "portfolio",
      name: "عکاسی",
      slug: "photo",
      folderId: 2265331,
      sortOrder: 1,
    },
    {
      id: "cat-portfolio-motion-sub",
      createdAt: "2026-01-01T00:00:00.000Z",
      section: "portfolio",
      name: "انیمیشن",
      slug: "animation",
      folderId: 2265332,
      parentId: "cat-portfolio-motion",
      sortOrder: 0,
    },
    {
      id: "cat-backstage-extra",
      createdAt: "2026-01-01T00:00:00.000Z",
      section: "backstage",
      name: "گرافیک",
      slug: "graphics",
      folderId: 2265327,
      sortOrder: 0,
    },
  ],
  cards: [],
};

const defaultContent = {
  portfolio: [{ id: 1, title: "قدیمی", category: "x", categoryId: "x", image: "/old.jpg", mediaKind: "image" as const }],
  portfolioCategories: [{ id: "x", name: "x", order: 0 }],
  backstage: [
    { id: 1, image: "/images/backstage-meeting.png", caption: "قدیمی ۱", mediaKind: "image" as const },
    { id: 2, image: "/images/backstage-meeting.png", caption: "قدیمی ۲", mediaKind: "image" as const },
  ],
  creativePartners: [],
  blogPosts: [],
};

describe("media center library entries", () => {
  it("collects section root and category folder ids for portfolio", () => {
    const ids = collectSectionFolderIds(store, "portfolio");
    expect(ids).toContain(2296586);
    expect(ids).toContain(2265330);
    expect(ids).toContain(2265331);
    expect(ids).toContain(2265332);
    expect(ids).not.toContain(2296587);
    expect(ids).toHaveLength(4);
  });

  it("collects only backstage folders for backstage section", () => {
    const ids = collectSectionFolderIds(store, "backstage");
    expect(ids).toEqual(expect.arrayContaining([2296587, 2265327]));
    expect(ids).toHaveLength(2);
  });

  it("returns localized folder labels", () => {
    expect(folderLabelForId(store, "backstage", 2296587)).toBe("پشت صحنه");
    expect(folderLabelForId(store, "portfolio", 2265330)).toBe("موشن گرافیک");
    expect(folderLabelForId(store, null, 2296588)).toBe("همکاران خلاق");
  });

  it("exports only root categories for portfolio filter chips", () => {
    const roots = mediaCategoriesToPortfolio(store.categories, "portfolio");
    expect(roots.map((c) => c.name)).toEqual(["موشن گرافیک", "عکاسی"]);
    expect(roots.some((c) => c.name.includes("›"))).toBe(false);
  });

  it("detects categories whose MyFile folder is gone", () => {
    const valid = new Set([2296586, 2265330, 2265331, 2265332, 2296587, 2265327]);
    const ids = collectOrphanCategoryIds(store.categories, valid);
    expect(ids.size).toBe(0);

    const withoutSub = new Set([2296586, 2265330, 2265331, 2296587, 2265327]);
    const orphaned = collectOrphanCategoryIds(store.categories, withoutSub);
    expect(orphaned.has("cat-portfolio-motion-sub")).toBe(true);
  });

  it("detects cards whose MyFile entry was deleted", () => {
    const cards: MediaCard[] = [
      {
        id: "card-1",
        section: "portfolio",
        categoryId: "cat-portfolio-motion",
        title: "تست",
        description: "desc",
        caption: "",
        role: "",
        city: "",
        cover: { entryId: 999001, kind: "image", shareUrl: "", fileName: "a.jpg" },
        video: null,
        image: null,
        avatar: null,
        sortOrder: 0,
        published: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const orphans = findCardsWithMissingMyFileEntries(cards, new Set([999002]));
    expect(orphans).toHaveLength(1);
    expect(orphans[0].title).toBe("تست");
  });

  it("replaces backstage with only published media-center cards", () => {
    const mediaStore: MediaCenterStore = {
      ...store,
      cards: [
        {
          id: "card-backstage-1",
          section: "backstage",
          categoryId: null,
          title: "اسلاید جدید",
          description: "",
          caption: "کپشن جدید",
          role: "",
          city: "",
          cover: null,
          video: null,
          image: { entryId: 555001, kind: "image", shareUrl: "", fileName: "new.jpg" },
          avatar: null,
          sortOrder: 0,
          published: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    const result = applyMediaCenterToSiteContent(
      structuredClone(defaultContent),
      mediaStore,
    );

    expect(result.backstage).toHaveLength(1);
    expect(result.backstage[0].caption).toBe("کپشن جدید");
    expect(result.backstage[0].image).toContain("555001");
  });

  it("keeps CMS backstage when media center has no backstage cards", () => {
    const result = applyMediaCenterToSiteContent(structuredClone(defaultContent), store);
    expect(result.backstage).toHaveLength(2);
    expect(result.backstage[0].caption).toBe("قدیمی ۱");
  });
});
