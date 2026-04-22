# ---------------------------------------------------------------
#  JellyFusion v2.0.0  -  Force push + auto-verify
#
#  Run from  D:\Archivos\Descargas\JellyFusion-source\JellyFusion :
#      .\push.ps1
#
#  Credentials prompt:
#      User:     KOOL4
#      Password: Personal Access Token (classic, scope 'repo')
#                https://github.com/settings/tokens
# ---------------------------------------------------------------

$ErrorActionPreference = 'Stop'

$repoUrl  = 'https://github.com/KOOL4/JellyFusion.git'
$rawUrl   = 'https://raw.githubusercontent.com/KOOL4/JellyFusion/main/manifest.json'
$tag      = 'v2.0.1'
$userName = 'KOOL4'
$userMail = 'jose13tony13@gmail.com'

function Assert-LastExit([string]$what) {
    if ($LASTEXITCODE -ne 0) {
        throw "STEP FAILED: $what  (git exit code $LASTEXITCODE)"
    }
}

Write-Host '==> Cleaning previous .git (if any)' -ForegroundColor Cyan
if (Test-Path .\.git) { Remove-Item -Recurse -Force .\.git }

Write-Host '==> git init' -ForegroundColor Cyan
git init -b main | Out-Null
Assert-LastExit 'git init'
git config user.name  $userName
git config user.email $userMail

Write-Host '==> Staging files' -ForegroundColor Cyan
git add -A
Assert-LastExit 'git add'
$staged = (git ls-files --cached | Measure-Object).Count
Write-Host "    $staged files staged"

Write-Host '==> Commit' -ForegroundColor Cyan
git commit -m "JellyFusion v2.0.0 - complete rewrite: 8 tabs, home rails, 7 themes, 4 languages" | Out-Null
Assert-LastExit 'git commit'

$localSha = (git rev-parse HEAD).Trim()
Write-Host "    Commit SHA: $localSha"

Write-Host "==> Tag $tag" -ForegroundColor Cyan
git tag -f -a $tag -m "JellyFusion v2.0.0 - all-in-one plugin"
Assert-LastExit 'git tag'

Write-Host '==> Adding remote' -ForegroundColor Cyan
git remote add origin $repoUrl
Assert-LastExit 'git remote add'

Write-Host '==> Force-pushing main to GitHub' -ForegroundColor Yellow
git push -u --force origin main
Assert-LastExit 'git push main'

Write-Host "==> Force-pushing tag $tag" -ForegroundColor Yellow
git push --force origin $tag
Assert-LastExit "git push tag"

Write-Host ''
Write-Host '==> Verifying remote main matches local commit' -ForegroundColor Cyan
$remoteLine = (git ls-remote origin main)
$remoteSha  = ($remoteLine -split '\s+')[0]
Write-Host "    Local  SHA : $localSha"
Write-Host "    Remote SHA : $remoteSha"
if ($remoteSha -ne $localSha) {
    throw "REMOTE MISMATCH - push did not land on origin/main"
}
Write-Host '    OK - remote main matches local commit' -ForegroundColor Green

Write-Host ''
Write-Host '==> Waiting 45s for raw.githubusercontent.com cache to refresh...' -ForegroundColor Cyan
Start-Sleep -Seconds 45

Write-Host "==> Fetching $rawUrl" -ForegroundColor Cyan
$ok = $false
try {
    $raw  = Invoke-WebRequest -UseBasicParsing -Uri $rawUrl -Headers @{ 'Cache-Control' = 'no-cache' } -ErrorAction Stop
    $json = $raw.Content | ConvertFrom-Json
    $versions = @($json)[0].versions | ForEach-Object { $_.version }
    Write-Host "    Versions in remote manifest: $($versions -join ', ')"
    if ($versions -contains '2.0.0.0') { $ok = $true }
} catch {
    Write-Warning "Fetch failed: $_"
}

Write-Host ''
if ($ok) {
    Write-Host '==> SUCCESS - v2.0.0 is LIVE on GitHub' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Add this URL to Jellyfin > Dashboard > Repositories:' -ForegroundColor Yellow
    Write-Host "    $rawUrl"
    Write-Host ''
    Write-Host 'Release ZIP (already uploaded):' -ForegroundColor Yellow
    Write-Host '    https://github.com/KOOL4/JellyFusion/releases/tag/v2.0.0'
} else {
    Write-Warning 'Remote manifest does not yet show v2.0.0.0 - raw cache is still warm.'
    Write-Warning 'Wait 2-3 more minutes and re-run this check:'
    Write-Warning "    Invoke-WebRequest -UseBasicParsing '$rawUrl' | Select -Expand Content"
}

Write-Host ''
Write-Host '==> DONE' -ForegroundColor Green
