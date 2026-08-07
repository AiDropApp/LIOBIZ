import json
m = json.load(open("/var/www/liobiz/.next/app-build-manifest.json"))
for k in m["pages"]:
    if "admin" in k or "dashboard" in k or k == "/layout":
        print(k, "->", m["pages"][k])
