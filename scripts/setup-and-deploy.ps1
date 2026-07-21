# Secure SSH on fresh VPS + full deploy
param(
  [string]$HostAlias = "liobiz",
  [string]$HostName = "185.205.203.116",
  [string]$User = "root"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

Write-Host "=== STEP 1: SSH SETUP (password may be asked once) ===" -ForegroundColor Cyan
Write-Host "Your IP whitelisted: 31.171.100.101 (+ backup 83.122.16.3)"
Write-Host ""

$setupScript = Join-Path $PSScriptRoot "fresh-server-setup.sh"
if (-not (Test-Path $setupScript)) { throw "Missing $setupScript" }

Get-Content $setupScript -Raw | ssh -o StrictHostKeyChecking=accept-new "${User}@${HostName}" "bash -s"
if ($LASTEXITCODE -ne 0) { throw "SSH setup failed" }

Write-Host ""
Write-Host "=== STEP 2: TEST KEY AUTH ===" -ForegroundColor Cyan
ssh -o BatchMode=yes -o ConnectTimeout=20 $HostAlias "echo SSH_KEY_OK"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Key auth not ready yet — retrying with password once..." -ForegroundColor Yellow
  ssh -o StrictHostKeyChecking=accept-new $HostAlias "echo SSH_OK"
}

Write-Host ""
Write-Host "=== STEP 3: FULL DEPLOY ===" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "deploy-to-liobiz.ps1") -HostAlias $HostAlias

Write-Host ""
Write-Host "=== ALL DONE ===" -ForegroundColor Green
