# Build minimal deploy package (changed files only + .next build)
param(
  [string]$OutDir = "deploy",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$manifestPath = Join-Path $Root "$OutDir\MANIFEST.txt"
if (-not (Test-Path $manifestPath)) {
  throw "Missing $manifestPath"
}

if (-not $SkipBuild) {
  Write-Host "=== BUILD ==="
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
}

$buildId = Get-Content ".next\BUILD_ID" -Raw
$buildId = $buildId.Trim()
Write-Host "BUILD_ID=$buildId"

Write-Host "=== PACK deploy-changes.tar (manifest only) ==="
$paths = Get-Content $manifestPath | Where-Object {
  $_ -and -not $_.StartsWith("#")
} | ForEach-Object { $_.Trim() }

$missing = @()
$existing = @()
foreach ($p in $paths) {
  $full = Join-Path $Root $p
  if (Test-Path -LiteralPath $full) { $existing += $p } else { $missing += $p }
}

if ($missing.Count -gt 0) {
  Write-Host "WARNING missing files (skipped):"
  $missing | ForEach-Object { Write-Host "  - $_" }
}

$changesTar = Join-Path $Root "$OutDir\deploy-changes.tar"
Remove-Item $changesTar -Force -ErrorAction SilentlyContinue

if ($existing.Count -eq 0) { throw "No files to pack" }

Push-Location $Root
try {
  foreach ($rel in $existing) {
    & tar -rf $changesTar -- $rel
    if ($LASTEXITCODE -ne 0) { throw "tar add failed: $rel" }
  }
} finally {
  Pop-Location
}

$changesMb = [math]::Round((Get-Item $changesTar).Length / 1MB, 2)
Write-Host "deploy-changes.tar: $changesMb MB ($($existing.Count) files)"

Write-Host "=== PACK next-build.tar ==="
$nextTar = Join-Path $Root "$OutDir\next-build.tar"
Remove-Item $nextTar -Force -ErrorAction SilentlyContinue
tar -cf $nextTar -C $Root .next
if ($LASTEXITCODE -ne 0) { throw "tar next-build failed" }

$nextMb = [math]::Round((Get-Item $nextTar).Length / 1MB, 1)
Write-Host "next-build.tar: $nextMb MB"

Copy-Item (Join-Path $Root "scripts\apply-deploy-changes.sh") (Join-Path $Root "$OutDir\apply-deploy-changes.sh") -Force

@"
BUILD_ID=$buildId
CREATED=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
FILES=$($existing.Count)
CHANGES_MB=$changesMb
NEXT_MB=$nextMb
"@ | Set-Content (Join-Path $Root "$OutDir\BUILD_INFO.txt") -Encoding utf8

Write-Host ""
Write-Host "=== READY ==="
Write-Host "Folder: $Root\$OutDir"
Write-Host "  deploy-changes.tar  (${changesMb} MB) - source changes only"
Write-Host "  next-build.tar      (${nextMb} MB) - required for Next.js"
Write-Host "  apply-deploy-changes.sh"
Write-Host "  BUILD_INFO.txt"
Write-Host ""
Write-Host "Upload these 3 files to server /tmp/ then run apply script (see deploy/README-DEPLOY.txt)"
