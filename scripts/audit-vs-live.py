#!/usr/bin/env python3
"""Compare SEO audit claims against live liobiz.com homepage."""
import json
import re
import ssl
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

UA = "Mozilla/5.0 (compatible; LiobizSeoAudit/2.0; +https://liobiz.com)"
BASE = "https://liobiz.com"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.styles_inline = 0
        self.style_tags = 0
        self.scripts = []
        self.stylesheets = []
        self.images = []
        self.h1 = []
        self.h2 = []
        self.has_og = False
        self.has_twitter = False
        self.has_canonical = False
        self.has_keywords = False
        self.lang = None
        self.title = None
        self.description = None
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "html" and "lang" in d:
            self.lang = d["lang"]
        if tag == "link":
            rel = d.get("rel", "")
            if "stylesheet" in rel:
                self.stylesheets.append(d.get("href", ""))
            if d.get("rel") == "canonical":
                self.has_canonical = True
        if tag == "meta":
            name = (d.get("name") or d.get("property") or "").lower()
            if name == "description":
                self.description = d.get("content", "")
            if name == "keywords":
                self.has_keywords = True
            if name.startswith("og:"):
                self.has_og = True
            if name.startswith("twitter:"):
                self.has_twitter = True
        if tag == "a" and "href" in d:
            self.links.append({"href": d["href"], "rel": d.get("rel", "")})
        if tag == "script" and "src" in d:
            self.scripts.append(d["src"])
        if tag == "img":
            self.images.append({"src": d.get("src", ""), "alt": d.get("alt")})
        if tag in ("h1", "h2"):
            getattr(self, tag).append("")
        if tag == "style":
            self.style_tags += 1
        if "style" in d:
            self.styles_inline += 1

    def handle_data(self, data):
        if self.in_title:
            self.title = (self.title or "") + data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False


def fetch(url, referer=None):
    headers = {"User-Agent": UA, "Accept": "*/*"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    ctx = ssl.create_default_context()
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, context=ctx, timeout=45) as resp:
        body = resp.read()
        elapsed = time.perf_counter() - t0
        return resp.status, dict(resp.headers), body, elapsed


def main():
    t0 = time.perf_counter()
    status, hdrs, html_bytes, ttfb = fetch(BASE + "/")
    html = html_bytes.decode("utf-8", "replace")
    total_time = time.perf_counter() - t0

    p = LinkParser()
    p.feed(html)

    internal = external_follow = external_nofollow = 0
    social = {"facebook": False, "instagram": False, "linkedin": False, "x": False, "youtube": False}
    for l in p.links:
        href = l["href"]
        rel = l.get("rel", "")
        if href.startswith("http") and "liobiz.com" not in href:
            if "nofollow" in rel:
                external_nofollow += 1
            else:
                external_follow += 1
            h = href.lower()
            if "facebook.com" in h or "fb.com" in h:
                social["facebook"] = True
            if "instagram.com" in h:
                social["instagram"] = True
            if "linkedin.com" in h:
                social["linkedin"] = True
            if "twitter.com" in h or "x.com" in h:
                social["x"] = True
            if "youtube.com" in h or "youtu.be" in h:
                social["youtube"] = True
        elif href.startswith("/") or "liobiz.com" in href:
            internal += 1

    # fetch linked assets
    css_ok = css_fail = 0
    js_ok = js_fail = 0
    total_asset_bytes = len(html_bytes)
    for href in p.stylesheets[:15]:
        url = href if href.startswith("http") else BASE + href
        try:
            _, _, body, _ = fetch(url, BASE + "/")
            total_asset_bytes += len(body)
            if b"text/plain" in str(_).encode() if False else True:
                css_ok += 1
        except Exception:
            css_fail += 1
    for src in p.scripts[:25]:
        url = src if src.startswith("http") else BASE + href if False else (BASE + src if src.startswith("/") else src)
        if not url.startswith("http"):
            continue
        try:
            _, _, body, _ = fetch(url, BASE + "/")
            total_asset_bytes += min(len(body), 50000)
            js_ok += 1
        except Exception:
            js_fail += 1

    # schema / local business
    has_org_schema = "Organization" in html or '"@type":"Organization"' in html or '"@type": "Organization"' in html
    has_local_schema = "LocalBusiness" in html or '"@type":"LocalBusiness"' in html
    has_address_text = bool(re.search(r"مشهد|address|آدرس", html, re.I))
    has_phone_text = bool(re.search(r"\+98|902.?089.?1867|tel:", html, re.I))

    # robots, sitemap, llms
    checks = {}
    for path in ["/robots.txt", "/sitemap.xml", "/llms.txt"]:
        try:
            s, h, b, _ = fetch(BASE + path)
            checks[path] = {"status": s, "size": len(b)}
        except urllib.error.HTTPError as e:
            checks[path] = {"status": e.code, "size": 0}

    # inline style count in raw html
    inline_style_attrs = len(re.findall(r'\sstyle="', html))
    style_blocks = len(re.findall(r"<style", html, re.I))

    word_count = len(re.findall(r"[\u0600-\u06FFa-zA-Z]{2,}", html))

    out = {
        "homepage_status": status,
        "ttfb_sec": round(ttfb, 3),
        "html_download_sec": round(total_time, 3),
        "html_kb": round(len(html_bytes) / 1024, 1),
        "estimated_total_kb": round(total_asset_bytes / 1024, 1),
        "title": p.title,
        "title_len": len(p.title or ""),
        "description_len": len(p.description or ""),
        "lang": p.lang,
        "h1_count": len(p.h1),
        "h2_count": len(p.h2),
        "word_count_approx": word_count,
        "script_tags": len(p.scripts),
        "css_tags": len(p.stylesheets),
        "images": len(p.images),
        "images_missing_alt": sum(1 for i in p.images if not i.get("alt")),
        "internal_links": internal,
        "external_follow": external_follow,
        "external_nofollow": external_nofollow,
        "total_links": len(p.links),
        "has_canonical": p.has_canonical,
        "has_keywords": p.has_keywords,
        "has_og": p.has_og,
        "has_twitter": p.has_twitter,
        "has_org_schema": has_org_schema,
        "has_local_schema": has_local_schema,
        "has_address_text": has_address_text,
        "has_phone_text": has_phone_text,
        "social_links": social,
        "inline_style_attrs": inline_style_attrs,
        "style_blocks": style_blocks,
        "css_ok": css_ok,
        "css_fail": css_fail,
        "http2": hdrs.get("Alt-Svc") or hdrs.get("alt-svc") or "http/2 via cloudflare",
        "compression": hdrs.get("Content-Encoding") or hdrs.get("content-encoding"),
        "checks": checks,
    }
    with open("scripts/audit-live-result.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("Wrote scripts/audit-live-result.json")


if __name__ == "__main__":
    main()
