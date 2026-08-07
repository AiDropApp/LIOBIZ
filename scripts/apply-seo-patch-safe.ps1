# Safe incremental SEO patch — uploads ONLY changed source files, builds ON server.
# Does NOT use deploy-full.tar / next-build.tar (avoids rolling back server state).
param(
  [string]$HostAlias = "liobiz",
  [int]$MaxRetries = 5
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$Files = @(
  "app/layout.tsx",
  "app/page.tsx",
  "next.config.ts",
  "lib/constants.ts",
  "lib/cms-html.ts",
  "lib/content-store.ts",
  "lib/seo-schema.ts",
  "lib/security-headers.ts",
  "lib/strip-content-styles.ts",
  "lib/homepage-limits.ts",
  "hooks/useHomeLanding.ts",
  "components/HomeDataProvider.tsx",
  "components/SeoKeywordsMeta.tsx",
  "components/SeoInternalLinks.tsx",
  "components/DeferredAnalytics.tsx",
  "components/FacebookPixel.tsx",
  "components/Footer.tsx",
  "components/AboutLiobiz.tsx",
  "components/hero/Hero.tsx",
  "components/Portfolio.tsx",
  "components/Services.tsx",
  "components/Process.tsx",
  "components/Backstage.tsx",
  "components/Plans.tsx",
  "components/FAQ.tsx",
  "components/BlogSection.tsx",
  "components/Testimonials.tsx",
  "components/Partners.tsx",
  "components/CreativePartners.tsx",
  "components/creative-partners.css",
  "components/SmoothScroll.tsx",
  "components/SmoothScrollInner.tsx",
  "components/LoadingScreen.tsx",
  "components/PwaBoot.tsx",
  "components/cms-edit/CmsRichTextField.tsx",
  "components/cms-edit/CmsCardRichInput.tsx",
  "scripts/strip-cms-inline-styles.mjs",
  "scripts/patch-server-seo.mjs",
  "scripts/apply-seo-patch-on-server.sh"
)

$Stage = Join-Path $env:TEMP "liobiz-seo-patch-files"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null

foreach ($rel in $Files) {
  $src = Join-Path $Root $rel
  if (-not (Test-Path $src)) { throw "Missing local file: $rel" }
  $dest = Join-Path $Stage $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item $src $dest -Force
}

Write-Host "Staged $($Files.Count) files -> $Stage"

function Invoke-ScpDir {
  param([string]$LocalDir, [string]$Remote)
  for ($i = 1; $i -le $MaxRetries; $i++) {
    ssh -o BatchMode=yes -o ConnectTimeout=30 $HostAlias "rm -rf $Remote && mkdir -p $Remote"
    scp -O -r -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=15 "$LocalDir/*" "${HostAlias}:${Remote}/"
    if ($LASTEXITCODE -eq 0) { return }
    Write-Host "SCP retry $i/$MaxRetries in 30s..."
    Start-Sleep -Seconds 30
  }
  throw "SCP failed uploading patch files"
}

Write-Host "=== UPLOAD PATCH FILES ==="
Invoke-ScpDir $Stage "/tmp/liobiz-seo-patch-files"

Write-Host "=== RUN SAFE PATCH ON SERVER ==="
$cmd = "sed -i 's/\r$//' /tmp/liobiz-seo-patch-files/scripts/apply-seo-patch-on-server.sh && bash /tmp/liobiz-seo-patch-files/scripts/apply-seo-patch-on-server.sh"
for ($i = 1; $i -le $MaxRetries; $i++) {
  ssh -o BatchMode=yes -o ConnectTimeout=30 $HostAlias $cmd
  if ($LASTEXITCODE -eq 0) { break }
  Write-Host "SSH retry $i/$MaxRetries in 30s..."
  Start-Sleep -Seconds 30
}
if ($LASTEXITCODE -ne 0) { throw "SSH patch failed" }

Write-Host "=== SAFE SEO PATCH COMPLETE ==="
