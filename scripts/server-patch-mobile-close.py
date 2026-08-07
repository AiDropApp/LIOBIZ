#!/usr/bin/env python3
from pathlib import Path

p = Path("/var/www/liobiz/app/globals.css")
text = p.read_text(encoding="utf-8")
marker = "  .portfolio-detail-close {\n    top: 0.65rem;\n    right: 0.65rem;"
if marker in text:
    print("Mobile close fix already applied")
    raise SystemExit(0)

needle = """  .portfolio-detail-media {
    min-height: 14rem;
    max-height: min(48svh, 22rem);
    padding: 0.65rem;
  }"""

insert = """  .portfolio-detail-close {
    top: 0.65rem;
    right: 0.65rem;
    left: auto;
  }

  .portfolio-detail-media {
    min-height: 14rem;
    max-height: min(48svh, 22rem);
    padding: 0.65rem;
  }"""

if needle not in text:
    print("ERROR: mobile portfolio block not found")
    raise SystemExit(1)

p.write_text(text.replace(needle, insert, 1), encoding="utf-8")
print("Mobile close fix applied")
