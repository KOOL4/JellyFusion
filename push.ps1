# ---------------------------------------------------------------
#  JellyFusion  -  First push to GitHub
#
#  Run once from  D:\Archivos\Descargas\JellyFusion-source\JellyFusion :
#     .\push.ps1
#
#  You will be prompted for your GitHub credentials. Use:
#     User:     KOOL4
#     Password: a Personal Access Token (classic, scope 'repo')
#               -> https://github.com/settings/tokens
# ---------------------------------------------------------------

$ErrorActionPreference = 'Stop'
$repoUrl  = 'https://github.com/KOOL4/Jellyfusion.git'
$tag      = 'v1.0.1'
$userName = 'KOOL4'
$userMail = 'jose13tony13@gmail.com'

Write-Host '==> Cleaning previous broken .git (if any)' -ForegroundColor Cyan
if (Test-Path .\.git) { Remove-Item -Recurse -Force .\.git }
if (Test-Path '.\{src') { Remove-Item -Recurse -Force '.\{src' }

Write-Host '==> git init' -ForegroundColor Cyan
git init -b main | Out-Null
git config user.name  $userName
git config user.email $userMail

Write-Host '==> Staging files' -ForegroundColor Cyan
git add -A
$staged = (git ls-files --cached | Measure-Object).Count
Write-Host "    $staged files staged"

Write-Host '==> Commit' -ForegroundColor Cyan
git commit -m "Initial release - JellyFusion v1.0.1" | Out-Null

Write-Host '==> Tag v1.0.1' -ForegroundColor Cyan
git tag -a $tag -m "JellyFusion v1.0.1 - Jellyfin 10.10 compatibility"

Write-Host '==> Adding remote' -ForegroundColor Cyan
git remote add origin $repoUrl

Write-Host '==> Pushing to GitHub (will prompt for credentials)' -ForegroundColor Cyan
git push -u origin main
git push origin $tag

Write-Host ''
Write-Host '==> DONE' -ForegroundColor Green
Write-Host "    Repo:  $repoUrl"
Write-Host "    Tag:   $tag"
Write-Host ''
Write-Host 'Next step: create the Release at' -ForegroundColor Yellow
Write-Host "    https://github.com/KOOL4/Jellyfusion/releases/new?tag=$tag"
Write-Host 'and attach:  releases\JellyFusion-v1.0.1.zip'
