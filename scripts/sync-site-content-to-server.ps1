# Sync cleaned CMS JSON to server (does not touch media)
param(
  [string]$HostAlias = "liobiz"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$LocalFile = Join-Path $Root "data/site-content.json"

if (-not (Test-Path $LocalFile)) {
  throw "Missing $LocalFile"
}

Write-Host "=== BACKUP SERVER site-content.json ==="
ssh -o BatchMode=yes $HostAlias "cp /var/www/liobiz/data/site-content.json /var/www/liobiz/data/site-content.bak-$(date +%Y%m%d-%H%M%S).json 2>/dev/null || true"

Write-Host "=== UPLOAD site-content.json ==="
scp -O -o BatchMode=yes $LocalFile "${HostAlias}:/var/www/liobiz/data/site-content.json"

Write-Host "=== RESTART ==="
ssh -o BatchMode=yes $HostAlias "systemctl restart liobiz && sleep 2 && systemctl is-active liobiz"

Write-Host "=== DONE ==="
