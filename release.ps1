# ---------------------------------------------------------------
#  JellyFusion v2.0.6  -  Create GitHub release + upload ZIP
#
#  Usage (from D:\Archivos\Descargas\JellyFusion-source\JellyFusion):
#      .\release.ps1                  # prompts for PAT
#      .\release.ps1 -Token ghp_xxx   # pass PAT directly
#
#  PAT: classic token, scope 'repo'
#       https://github.com/settings/tokens
#
#  Requires push.ps1 to have already run so the tag v2.0.6 exists
#  on origin (otherwise this script will create a tag pointing at
#  the latest commit on main, which is also fine).
# ---------------------------------------------------------------

param(
    [string]$Token   = "",
    [string]$Version = "2.0.6",
    [string]$Owner   = "KOOL4",
    [string]$Repo    = "JellyFusion"
)

$ErrorActionPreference = 'Stop'

$tag       = "v$Version"
$zipName   = "JellyFusion-v$Version.zip"
$zipPath   = Join-Path $PSScriptRoot "releases\$zipName"
$notesPath = Join-Path $PSScriptRoot "manifest.json"

if (-not (Test-Path $zipPath)) {
    throw "ZIP not found: $zipPath  (run .\build.ps1 first)"
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    $sec = Read-Host -AsSecureString "GitHub PAT (classic, scope 'repo')"
    $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

# Extract the v2.0.6 changelog from manifest.json so the release body
# matches exactly what Jellyfin will show in its plugin catalog.
Write-Host "==> Extracting changelog from manifest.json" -ForegroundColor Cyan
$manifestRaw = Get-Content $notesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$manifest    = @($manifestRaw)
$entry       = $manifest[0].versions | Where-Object { $_.version -eq "$Version.0" } | Select-Object -First 1
if (-not $entry) { throw "manifest.json has no entry for version $Version.0" }
$body = "### JellyFusion $tag`n`n" + $entry.changelog
Write-Host "    Changelog length: $($body.Length) chars"

$apiBase = "https://api.github.com/repos/$Owner/$Repo"
$headers = @{
    Authorization           = "Bearer $Token"
    Accept                  = "application/vnd.github+json"
    "X-GitHub-Api-Version"  = "2022-11-28"
    "User-Agent"            = "JellyFusion-release-ps"
}

# Step 1: delete any existing release for this tag (idempotent)
Write-Host "==> Checking for existing release on tag $tag" -ForegroundColor Cyan
try {
    $existing = Invoke-RestMethod -Method Get -Uri "$apiBase/releases/tags/$tag" -Headers $headers -ErrorAction Stop
    Write-Host "    Existing release id $($existing.id) - deleting so we can recreate" -ForegroundColor Yellow
    Invoke-RestMethod -Method Delete -Uri "$apiBase/releases/$($existing.id)" -Headers $headers | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
    Write-Host "    No existing release (OK)"
}

# Step 2: create the release
Write-Host "==> Creating release $tag" -ForegroundColor Cyan
$payload = @{
    tag_name         = $tag
    name             = "JellyFusion $tag"
    body             = $body
    draft            = $false
    prerelease       = $false
    generate_release_notes = $false
} | ConvertTo-Json -Depth 4

$release = Invoke-RestMethod -Method Post -Uri "$apiBase/releases" `
    -Headers $headers -ContentType "application/json" -Body $payload
Write-Host "    Release id : $($release.id)"
Write-Host "    HTML URL   : $($release.html_url)"

# Step 3: upload the ZIP as release asset
Write-Host "==> Uploading $zipName" -ForegroundColor Cyan
$uploadUrl = $release.upload_url -replace '\{.*\}$', ''
$uploadUrl = "$uploadUrl?name=$zipName"

$uploadHeaders = @{
    Authorization          = "Bearer $Token"
    Accept                 = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent"           = "JellyFusion-release-ps"
}

$asset = Invoke-RestMethod -Method Post -Uri $uploadUrl `
    -Headers $uploadHeaders -ContentType "application/zip" `
    -InFile $zipPath
Write-Host "    Asset id        : $($asset.id)"
Write-Host "    Asset size      : $($asset.size) bytes"
Write-Host "    Asset download  : $($asset.browser_download_url)"

Write-Host ""
Write-Host "==> SUCCESS - v$Version is published" -ForegroundColor Green
Write-Host ""
Write-Host "Release page:"    -ForegroundColor Yellow
Write-Host "    $($release.html_url)"
Write-Host ""
Write-Host "Download URL (matches manifest.json sourceUrl):" -ForegroundColor Yellow
Write-Host "    $($asset.browser_download_url)"
Write-Host ""
Write-Host "==> DONE" -ForegroundColor Green
