#!/usr/bin/env python3
import gzip
import re
import ssl
import urllib.request

UA = "Mozilla/5.0 (compatible; SEOBot/1.0)"
req = urllib.request.Request("https://liobiz.com/", headers={"User-Agent": UA})
raw = urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=45).read()
html = raw.decode("utf-8", "replace")

# strip RSC flight scripts for "document markup" estimate
no_rsc = re.sub(r"<script[^>]*>self\.__next_f[^<]*</script>", "", html, flags=re.I)
no_scripts = re.sub(r"<script[\s\S]*?</script>", "", html, flags=re.I)

print("raw_kb", round(len(raw) / 1024, 1))
print("gzip_kb", round(len(gzip.compress(raw)) / 1024, 1))
print("no_rsc_kb", round(len(no_rsc.encode()) / 1024, 1))
print("no_scripts_kb", round(len(no_scripts.encode()) / 1024, 1))

head = html.split("</head>")[0]
metas = re.findall(r"<meta[^>]+>", head, re.I)
for m in metas:
    if "keyword" in m.lower():
        print("META:", m.encode("unicode_escape").decode())

print("img_tags", len(re.findall(r"<img ", html)))
print("script_src", len(re.findall(r'<script[^>]+src="', html)))
