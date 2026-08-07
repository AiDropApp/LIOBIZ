# Sync project from server -> local (NO large media files)
param(
  [string]$HostAlias = "liobiz",
  [switch]$Full
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if ($Full) {
  Write-Host "WARNING: -Full includes ~5GB media. Use only if you really need it." -ForegroundColor Red
  Write-Host "Press Ctrl+C to cancel, or wait 5 seconds..."
  Start-Sleep -Seconds 5
  $excludes = @(
    "--exclude=node_modules", "--exclude=.next",
    "--exclude=./deploy-full.tar", "--exclude=./next-build.tar",
    "--exclude=./data/.golden-temp",
    "--exclude=./data/golden-backups/*.tar",
    "--exclude=./data/golden-backups/*.part.*"
  )
  ssh -o BatchMode=yes $HostAlias "cd /var/www/liobiz && tar cf - $($excludes -join ' ') ." | tar xf - -C $Root
  if ($LASTEXITCODE -ne 0) { throw "Full sync failed" }
  Write-Host "FULL_SYNC_OK"
  exit 0
}

Write-Host "=== SYNC FROM SERVER (code + data, NO media) ===" -ForegroundColor Cyan
Write-Host "Includes: source code, data/, small public assets"
Write-Host "Skips: public/media (~5GB), public/video, public/videos, node_modules, .next"
Write-Host ""

$codeDirs = @("app", "components", "lib", "scripts", "tests", "hooks", "types", "docs")
$codeFiles = @(
  "package.json", "pnpm-lock.yaml", "tsconfig.json", "next.config.ts",
  "tailwind.config.ts", "postcss.config.mjs", "middleware.ts",
  "playwright.config.ts", "next-env.d.ts", "next-pwa.d.ts", "global.d.ts",
  "vitest.config.ts", "docker-compose.yml", "Dockerfile", "README.md"
)

foreach ($dir in $codeDirs) {
  Write-Host "  $dir/ ..."
  scp -O -r "${HostAlias}:/var/www/liobiz/$dir" "$Root/" 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "    skip" -ForegroundColor DarkGray }
}

foreach ($file in $codeFiles) {
  Write-Host "  $file ..."
  scp -O "${HostAlias}:/var/www/liobiz/$file" "$Root/" 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "    skip" -ForegroundColor DarkGray }
}

Write-Host "  data/ (JSON, DB, backups metadata) ..."
New-Item -ItemType Directory -Force -Path "$Root/data" | Out-Null
scp -O -r "${HostAlias}:/var/www/liobiz/data" "$Root/" 2>$null

Write-Host "  public/images, public/icons, public/uploads (small assets only) ..."
New-Item -ItemType Directory -Force -Path "$Root/public" | Out-Null
foreach ($pub in @("images", "icons", "uploads")) {
  scp -O -r "${HostAlias}:/var/www/liobiz/public/$pub" "$Root/public/" 2>$null
}
foreach ($pubFile in @("manifest.json", "sw.js", "googlef7e58775fcd4e139.html")) {
  scp -O "${HostAlias}:/var/www/liobiz/public/$pubFile" "$Root/public/" 2>$null
}

Write-Host ""
Write-Host "=== DONE (~30MB, not 5GB) ===" -ForegroundColor Green
Write-Host "Media stays on server only. Run: pnpm install"
