#!/usr/bin/env python3
import gzip, re, ssl, urllib.request
UA = "Mozilla/5.0 (compatible; SEOBot/1.0)"
raw = urllib.request.urlopen(
    urllib.request.Request("https://liobiz.com/", headers={"User-Agent": UA}),
    context=ssl.create_default_context(),
    timeout=45,
).read()
html = raw.decode("utf-8", "replace")
head = html.split("</head>")[0]
kw_tags = re.findall(r'<meta[^>]*name=["\']keywords["\'][^>]*>', head, re.I)
print("gzip_kb:", round(len(gzip.compress(raw)) / 1024, 1))
print("keywords_count:", len(kw_tags))
print("has_english_kw:", "liobiz" in (kw_tags[0].lower() if kw_tags else ""))
print("seo-internal-links:", "seo-internal-links" in html)
print("img:", len(re.findall(r"<img ", html)))
print("js:", len(re.findall(r'<script[^>]+src="', html)))
print("css:", len(re.findall(r'rel="stylesheet"', html)))
print("inline_style:", len(re.findall(r'\\sstyle="', html)))
