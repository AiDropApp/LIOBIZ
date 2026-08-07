#!/usr/bin/env python3
import re, ssl, urllib.request
UA = "Mozilla/5.0 (compatible; SEOBot/1.0)"
req = urllib.request.Request("https://liobiz.com/", headers={"User-Agent": UA})
html = urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=45).read().decode("utf-8", "replace")
head = html.split("</head>")[0] if "</head>" in html else html[:8000]
kw = len(re.findall(r'<meta[^>]*name=["\']keywords["\'][^>]*>', head, re.I))
print("keywords_meta:", kw)
print("seo-internal-links:", "seo-internal-links" in html)
print("home-data-provider:", "HomeDataProvider" in html or "useHomeData" in html)
print("img_tags:", len(re.findall(r"<img ", html)))
print("script_src:", len(re.findall(r'<script[^>]+src="', html)))
print("gzip_estimate_kb:", round(len(html.encode())/1024, 1))
