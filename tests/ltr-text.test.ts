import { describe, expect, it } from "vitest";
import { splitPathSegments } from "@/lib/ltr-text";

describe("splitPathSegments", () => {
  it("splits filesystem paths", () => {
    expect(splitPathSegments("portfolio/موشن گرافیک")).toEqual(["portfolio", "موشن گرافیک"]);
  });

  it("splits breadcrumb paths with spaces", () => {
    expect(splitPathSegments("نمونه کار / موشن گرافیک")).toEqual(["نمونه کار", "موشن گرافیک"]);
  });

  it("splits category paths with chevrons", () => {
    expect(splitPathSegments("بلاگ › مقالات")).toEqual(["بلاگ", "مقالات"]);
  });

  it("normalizes backslashes", () => {
    expect(splitPathSegments("portfolio\\sub\\file")).toEqual(["portfolio", "sub", "file"]);
  });

  it("returns empty for blank input", () => {
    expect(splitPathSegments("   ")).toEqual([]);
  });
});
