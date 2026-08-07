#!/usr/bin/env python3
import gzip
import re
import ssl
import urllib.request

URL = "http://127.0.0.1:3099/"
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)"})
raw = urllib.request.urlopen(req, timeout=45).read()
html = raw.decode("utf-8", "replace")

head = html.split("</head>")[0]
kw = re.findall(r'<meta[^>]*name=["\']keywords["\'][^>]*>', head, re.I)

print("gzip_kb", round(len(gzip.compress(raw)) / 1024, 1))
print("raw_kb", round(len(raw) / 1024, 1))
print("keywords_meta_count", len(kw))
print("keywords_meta_sample", kw[0].encode("unicode_escape").decode() if kw else "NONE")
print("img_tags", len(re.findall(r"<img ", html)))
print("script_src", len(re.findall(r'<script[^>]+src="', html)))
print("css_links", len(re.findall(r'rel="stylesheet"', html)))
print("total_resources", len(re.findall(r"<img ", html)) + len(re.findall(r'<script[^>]+src="', html)) + len(re.findall(r'rel="stylesheet"', html)))
print("inline_style", len(re.findall(r'\\sstyle="', html)))

scripts = re.findall(r'src="(/_next/static/chunks/[^"]+\.js)"', html)
if scripts:
    chunk = "http://127.0.0.1:3099" + scripts[0]
    body = urllib.request.urlopen(chunk, timeout=20).read(4000).decode("utf-8", "replace")
    print("first_chunk_lines", body.count("\n") + 1, "len", len(body))
