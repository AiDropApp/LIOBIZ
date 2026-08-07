#!/usr/bin/env python3
"""Patch nginx to block hotlink/direct download of media files."""
from pathlib import Path

conf = Path("/etc/nginx/sites-available/liobiz")
text = conf.read_text(encoding="utf-8")

if "MEDIA_ANTI_HOTLINK" in text:
    print("nginx anti-hotlink already applied")
    raise SystemExit(0)

block = """    # MEDIA_ANTI_HOTLINK — only serve media when requested from liobiz.com pages
    set $media_hotlink 0;
    if ($http_referer !~* ^https?://(www\\.)?liobiz\\.com) {
        set $media_hotlink 1;
    }
    if ($http_referer = "") {
        set $media_hotlink 1;
    }
    if ($media_hotlink = 1) {
        return 403;
    }
    add_header Content-Disposition "inline" always;
    add_header X-Content-Type-Options "nosniff" always;
"""

locations = [
    "    location ^~ /media/ {",
    "    location ^~ /video/ {",
    "    location ^~ /videos/ {",
    "    location ^~ /uploads/ {",
    "    location ^~ /images/ {",
    "    location ~ ^/api/media/(portfolio|backstage|hero|about|creative-partners|orders|uploads)/ {",
]

for loc in locations:
    if loc not in text:
        print(f"ERROR: location not found: {loc}")
        raise SystemExit(1)
    text = text.replace(loc, loc + "\n" + block, 1)

conf.write_text(text, encoding="utf-8")
print("nginx patched OK")
