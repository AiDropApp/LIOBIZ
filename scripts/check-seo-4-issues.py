#!/usr/bin/env python3
import re, ssl, urllib.request

UA = "Mozilla/5.0 (compatible; SEOBot/1.0)"
req = urllib.request.Request("https://liobiz.com/", headers={"User-Agent": UA})
html = urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=45).read().decode("utf-8", "replace")

head = html.split("</head>")[0] if "</head>" in html else html[:8000]
print("total_kb", round(len(html.encode()) / 1024, 1))
print("head_kb", round(len(head.encode()) / 1024, 1))

for pat in [
    r'<meta[^>]*name=["\']keywords["\'][^>]*>',
    r'<meta[^>]*content=[^>]*name=["\']keywords["\'][^>]*>',
]:
    m = re.findall(pat, head, re.I)
    print("keywords_meta", len(m))
    for x in m:
        print(" ", x[:250])

print("scripts", len(re.findall(r"<script[^>]+src=", html)))
print("css", len(re.findall(r'rel="stylesheet"', html)))
print("imgs", len(re.findall(r"<img ", html)))
print("inline_style", len(re.findall(r'\sstyle="', html)))
print("next_data", "self.__next_f" in html)

# check chunk minification
chunk = "https://liobiz.com/_next/static/chunks/2365-54d516fe418d6ab7.js"
req2 = urllib.request.Request(chunk, headers={"User-Agent": UA, "Referer": "https://liobiz.com/"})
try:
    body = urllib.request.urlopen(req2, context=ssl.create_default_context(), timeout=30).read(3000).decode("utf-8", "replace")
    lines = body.count("\n") + 1
    print("chunk_lines", lines, "sample", body[:80].replace("\n", " "))
except Exception as e:
    print("chunk_err", e)
