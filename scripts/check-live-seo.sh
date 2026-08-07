#!/usr/bin/env bash
curl -sL https://liobiz.com/ -o /tmp/h2.html
grep -o 'seo-internal[^" ]*' /tmp/h2.html | head -3
grep -i 'name="keywords"' /tmp/h2.html | head -1
python3 <<'PY'
h=open("/tmp/h2.html",encoding="utf-8",errors="ignore").read()
i=h.find("about-liobiz")
print(h[i:i+1800] if i>=0 else "missing")
PY
