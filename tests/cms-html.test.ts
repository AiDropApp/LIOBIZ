import { describe, expect, it } from "vitest";
import { sanitizeCmsHtml } from "@/lib/cms-html";
import { sanitizeFieldValueForTest } from "@/lib/cms-field-sanitize";

describe("sanitizeCmsHtml", () => {
  it("keeps bold and italic", () => {
    const html = "<p><strong><em>bold italic</em></strong></p>";
    expect(sanitizeCmsHtml(html)).toContain("<strong>");
    expect(sanitizeCmsHtml(html)).toContain("<em>");
  });

  it("keeps links", () => {
    const html = '<p><a href="https://example.com" target="_blank">link</a></p>';
    const out = sanitizeCmsHtml(html);
    expect(out).toContain('href="https://example.com"');
  });

  it("keeps font-size and font-family inline styles", () => {
    const html =
      '<p><span style="font-size: 24px; font-family: Vazirmatn, sans-serif; color: #ff0000">test</span></p>';
    const out = sanitizeCmsHtml(html);
    expect(out).toContain("font-size");
    expect(out).toContain("24px");
    expect(out).toContain("font-family");
    expect(out).toContain("Vazirmatn");
    expect(out).toContain("#ff0000");
  });
});

describe("cms field sanitize", () => {
  it("preserves html for href fields", () => {
    const html = '<p><a href="/process">جزئیات</a></p>';
    expect(sanitizeFieldValueForTest("landing.processLinkHref", html)).toBe(sanitizeCmsHtml(html));
  });

  it("sanitizes plain href values as urls", () => {
    expect(sanitizeFieldValueForTest("landing.processLinkHref", "/process")).toBe("/process");
  });
});
