#!/usr/bin/env python3
"""Analyze live liobiz.com homepage for SEO/performance audit signals."""
import re
import urllib.request

URL = "https://liobiz.com/"
req = urllib.request.Request(
    URL,
    headers={
        "User-Agent": "Mozilla/5.0 (compatible; LiobizSeoAudit/1.0; +https://liobiz.com)",
        "Accept": "text/html",
    },
)
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
styles = re.findall(r'rel="stylesheet"[^>]+href="([^"]+)"', html)
styles += re.findall(r'href="([^"]+\.css)"[^>]+rel="stylesheet"', html)
preloads = re.findall(r'rel="preload"[^>]+href="([^"]+)"', html)
images = re.findall(r'<img[^>]+src="([^"]+)"', html)
h2s = re.findall(r"<h2[^>]*>([^<]+)", html)
h1s = re.findall(r"<h1[^>]*>([^<]+)", html)

print("=== LIVE PAGE ANALYSIS ===")
print(f"HTML size KB: {len(html.encode()) / 1024:.1f}")
print(f"Word-ish count (Persian+Latin): {len(re.findall(r'[\u0600-\u06FFa-zA-Z]{2,}', html))}")
print(f"H1 ({len(h1s)}): {h1s[:3]}")
print(f"H2 count: {len(h2s)}")
print(f"Script src tags: {len(scripts)}")
print(f"Stylesheets: {len(styles)}")
print(f"Preloads: {len(preloads)}")
print(f"Images in HTML: {len(images)}")
print(f"keywords meta: {'yes' if 'keywords' in html else 'no'}")
print(f"seo-internal-links: {'yes' if 'seo-internal-links' in html else 'no'}")

sections = [
    "portfolio", "process", "backstage", "plans", "faq", "blog", "testimonials", "partners", "services"
]
print("\n=== SECTION MARKERS ===")
for s in sections:
    print(f"  {s}: {'FOUND' if s in html.lower() or id(s) else 'MISSING'}")

# Better section detection
markers = {
    "Portfolio": "portfolio" in html.lower() or "نمونه کار" in html,
    "Process": "process" in html.lower() or "فرآیند" in html,
    "Backstage": "backstage" in html.lower() or "پشت صحنه" in html,
    "Plans": "plans" in html.lower() or "پلن" in html,
    "FAQ": "faq" in html.lower() or "سوالات" in html,
    "Blog": "blog" in html.lower() or "مقالات" in html,
    "Testimonials": "testimonial" in html.lower() or "نظر" in html,
    "Partners": "partner" in html.lower() or "همکار" in html,
}
for name, found in markers.items():
    print(f"  {name}: {'FOUND' if found else 'MISSING'}")

print("\n=== SCRIPTS ===")
for s in scripts:
    print(f"  {s}")

print("\n=== STYLES ===")
for s in styles:
    print(f"  {s}")

# Check JS minification on first few chunks
print("\n=== JS MINIFICATION CHECK ===")
for s in scripts[:8]:
    if not s.startswith("http"):
        s = "https://liobiz.com" + s
    try:
        body = urllib.request.urlopen(s, timeout=20).read(4000).decode("utf-8", "replace")
        lines = body.count("\n") + 1
        has_spaces = "  " in body[:500]
        sample = body[:120].replace("\n", " ")
        print(f"  {s.split('/')[-1]}: lines~{lines}, minified={'yes' if lines < 5 else 'maybe-no'}, sample={sample[:80]}...")
    except Exception as e:
        print(f"  {s}: ERROR {e}")
