import re
import urllib.request

req = urllib.request.Request(
    "https://liobiz.com/",
    headers={"User-Agent": "Mozilla/5.0 (compatible; LiobizSeoAudit/1.0)"},
)
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

print("section-skeleton:", "section-skeleton" in html)
print("id=portfolio:", 'id="portfolio"' in html)
print("id=faq:", 'id="faq"' in html)

h2s = re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.S)
print("h2 count:", len(h2s))
for h in h2s:
    t = re.sub(r"<[^>]+>", "", h).strip()
    print(" H2:", t[:80])

# Seobility-like: paragraphs > 100 chars of text
text = re.sub(r"<script[\s\S]*?</script>", " ", html)
text = re.sub(r"<style[\s\S]*?</style>", " ", text)
paras = re.findall(r"<p[^>]*>([\s\S]*?)</p>", text)
long_paras = []
for p in paras:
    plain = re.sub(r"<[^>]+>", " ", p)
    plain = re.sub(r"\s+", " ", plain).strip()
    words = plain.split()
    if len(plain) >= 100:
        long_paras.append((len(words), plain[:100]))
print("paragraphs >=100 chars:", len(long_paras))
print("total words in long paras:", sum(w for w, _ in long_paras))
