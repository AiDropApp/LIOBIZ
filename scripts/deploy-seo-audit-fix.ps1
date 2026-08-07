# Deploy SEO audit fixes (run when SSH to liobiz is available)
$ErrorActionPreference = "Stop"
$Root = "d:\liobiz\liobiz"
Set-Location $Root

pnpm build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

Remove-Item deploy-full.tar, next-build.tar -Force -ErrorAction SilentlyContinue
tar -cf deploy-full.tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=data --exclude=public/media --exclude=public/uploads --exclude=public/video --exclude=public/videos --exclude=.env.local --exclude=deploy-full.tar --exclude=next-build.tar -C $Root .
tar -cf next-build.tar -C $Root .next

function Invoke-ScpLegacy($Local, $Remote) {
  for ($i = 1; $i -le 5; $i++) {
    scp -O -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=15 $Local "liobiz:$Remote"
    if ($LASTEXITCODE -eq 0) { return }
    Start-Sleep -Seconds 30
  }
  throw "SCP failed: $Local"
}

Invoke-ScpLegacy "deploy-full.tar" "/tmp/deploy-full.tar"
Invoke-ScpLegacy "next-build.tar" "/tmp/next-build.tar"
scp -O -o BatchMode=yes "$Root\scripts\remote-deploy.sh" "liobiz:/tmp/remote-deploy.sh"
scp -O -o BatchMode=yes "$Root\scripts\patch-server-seo.mjs" "liobiz:/tmp/patch-server-seo.mjs"
scp -O -o BatchMode=yes "$Root\scripts\strip-cms-inline-styles.mjs" "liobiz:/tmp/strip-cms-inline-styles.mjs"

ssh -o BatchMode=yes liobiz "sed -i 's/\r$//' /tmp/remote-deploy.sh && bash /tmp/remote-deploy.sh && node /tmp/patch-server-seo.mjs /var/www/liobiz && node /tmp/strip-cms-inline-styles.mjs /var/www/liobiz && systemctl restart liobiz && sleep 3 && systemctl is-active liobiz && curl -s -o /dev/null -w 'public:%{http_code}\n' https://liobiz.com/"

Write-Host "SEO DEPLOY COMPLETE"
