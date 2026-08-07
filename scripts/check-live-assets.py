#!/usr/bin/env python3
"""Check live asset headers and CSS availability."""
import re
import ssl
import urllib.error
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
BASE = "https://liobiz.com"


def fetch(url: str, method: str = "GET", referer: str | None = None) -> tuple[int, dict[str, str], bytes]:
    headers = {"User-Agent": UA}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers, method=method)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            body = resp.read(8000)
            return resp.status, dict(resp.headers), body
    except urllib.error.HTTPError as e:
        body = e.read(8000) if e.fp else b""
        return e.code, dict(e.headers), body


def main() -> None:
    status, _, html_bytes = fetch(BASE + "/")
    html = html_bytes.decode("utf-8", "replace")
    print(f"Homepage: {status}, size={len(html_bytes)}")

    css_urls = re.findall(r'href="(/_next/static/css/[^"]+\.css)"', html)
    js_urls = re.findall(r'src="(/_next/static/chunks/[^"]+\.js)"', html)

    print(f"\nCSS files referenced ({len(css_urls)}):")
    for path in css_urls:
        code, hdrs, body = fetch(BASE + path, referer=BASE + "/")
        ctype = hdrs.get("Content-Type", hdrs.get("content-type", "?"))
        print(f"  {path}")
        print(f"    status={code} type={ctype} bytes={len(body)}")
        if code == 200 and "text/css" not in ctype:
            print(f"    WARNING: wrong MIME type")
            print(f"    sample: {body[:120]!r}")

    print(f"\nJS chunks sample ({min(3, len(js_urls))}):")
    for path in js_urls[:3]:
        code, hdrs, body = fetch(BASE + path, referer=BASE + "/")
        ctype = hdrs.get("Content-Type", hdrs.get("content-type", "?"))
        print(f"  {path}: status={code} type={ctype} bytes={len(body)}")

    cf = "https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496"
    code, hdrs, _ = fetch(cf)
    print(f"\nCloudflare beacon: status={code}")


if __name__ == "__main__":
    main()
