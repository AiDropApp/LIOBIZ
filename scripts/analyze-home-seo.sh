#!/usr/bin/env bash
curl -sL https://liobiz.com/ -o /tmp/home.html
echo "=== meta keywords ==="
grep -i 'name="keywords"' /tmp/home.html || echo "NONE"
echo "=== h1 count ==="
grep -o '<h1' /tmp/home.html | wc -l
echo "=== hero-eyebrow ==="
grep -c hero-eyebrow /tmp/home.html
echo "=== link counts ==="
python3 <<'PY'
import re
html=open("/tmp/home.html",encoding="utf-8",errors="ignore").read()
hrefs=re.findall(r'href="([^"]+)"', html)
internal=external=other=0
for h in hrefs:
    if h.startswith("#") or h.startswith("mailto:") or h.startswith("tel:"):
        other+=1
    elif h.startswith("/") or h.startswith("https://liobiz.com") or h.startswith("http://liobiz.com"):
        internal+=1
    elif h.startswith("http"):
        external+=1
    else:
        other+=1
print("total", len(hrefs))
print("internal", internal)
print("external", external)
print("other", other)
print("ratio int/ext", round(internal/max(external,1),2))
print("external samples:")
for h in hrefs:
    if h.startswith("http") and "liobiz.com" not in h:
        print(" ", h)
PY
