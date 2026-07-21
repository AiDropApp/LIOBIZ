# Deploy Liobiz to VPS via SSH (Windows OpenSSH needs scp -O)
param(
  [string]$HostAlias = "liobiz",
  [int]$MaxRetries = 5
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Wait-Ssh {
  param([int]$Attempts = 10)
  for ($i = 1; $i -le $Attempts; $i++) {
    ssh -o BatchMode=yes -o ConnectTimeout=20 $HostAlias "echo SSH_OK" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { return $true }
    Write-Host "SSH not ready ($i/$Attempts), waiting 20s..."
    Start-Sleep -Seconds 20
  }
  return $false
}

function Invoke-ScpLegacy {
  param([string]$Local, [string]$Remote)
  for ($i = 1; $i -le $MaxRetries; $i++) {
    scp -O -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=15 $Local "${HostAlias}:${Remote}"
    if ($LASTEXITCODE -eq 0) { return }
    Write-Host "SCP failed ($i/$MaxRetries), retry in 30s..."
    Start-Sleep -Seconds 30
  }
  throw "SCP failed for $Local"
}

Write-Host "=== BUILD ==="
pnpm build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

Write-Host "=== TAR ==="
Remove-Item deploy-full.tar, next-build.tar -Force -ErrorAction SilentlyContinue
tar -cf deploy-full.tar `
  --exclude=node_modules `
  --exclude=.next `
  --exclude=.git `
  --exclude=.deploy `
  --exclude=data `
  --exclude=header.mp4 `
  --exclude=docs/screenshots `
  --exclude=public/uploads `
  --exclude=.env.local `
  --exclude=deploy-full.tar `
  --exclude=next-build.tar `
  -C $Root .
tar -cf next-build.tar -C $Root .next

Write-Host "=== WAIT SSH ==="
if (-not (Wait-Ssh)) { throw "Cannot reach $HostAlias on port 22. Check VPS firewall / fail2ban / provider panel." }

Write-Host "=== UPLOAD (scp -O required on Windows) ==="
Invoke-ScpLegacy "deploy-full.tar" "/tmp/deploy-full.tar"
Invoke-ScpLegacy "next-build.tar" "/tmp/next-build.tar"

Write-Host "=== DEPLOY ==="
scp -O -o BatchMode=yes -o ConnectTimeout=30 (Join-Path $PSScriptRoot "remote-deploy.sh") "${HostAlias}:/tmp/remote-deploy.sh"
$cmd = "sed -i 's/\r$//' /tmp/remote-deploy.sh && bash /tmp/remote-deploy.sh"
ssh -o BatchMode=yes $HostAlias $cmd

Remove-Item deploy-full.tar, next-build.tar -Force -ErrorAction SilentlyContinue
Write-Host "=== DONE ==="
