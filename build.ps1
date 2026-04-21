param(
    [string]$Version = "1.0.0",
    [string]$Guid    = "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    [string]$Owner   = "KOOL4"
)

$ErrorActionPreference = "Stop"
$Root   = $PSScriptRoot
$Proj   = Join-Path $Root "src\JellyFusion\JellyFusion.csproj"
$Pub    = Join-Path $Root "publish"
$Rel    = Join-Path $Root "releases"
$ZipOut = Join-Path $Rel  ("JellyFusion-v" + $Version + ".zip")
$Meta   = Join-Path $Pub  "meta.json"

Write-Host "==> Cleaning previous build"
if (Test-Path $Pub) { Remove-Item $Pub -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Pub | Out-Null
New-Item -ItemType Directory -Force -Path $Rel | Out-Null

Write-Host "==> Publishing $Version"
dotnet publish $Proj `
    --configuration Release `
    --output $Pub `
    "-p:Version=$Version" `
    "-p:AssemblyVersion=$Version.0" `
    "-p:FileVersion=$Version.0"
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }

Write-Host "==> Publish folder contents:"
Get-ChildItem $Pub | Format-Table Name, Length

$extraDlls = Get-ChildItem $Pub -Filter *.dll | Where-Object { $_.Name -ne "JellyFusion.dll" }
if ($extraDlls) {
    Write-Warning "Extra DLLs in publish output (should not happen):"
    foreach ($d in $extraDlls) { Write-Warning ("  - " + $d.Name) }
}

Write-Host "==> Writing meta.json"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$metaObj = [ordered]@{
    category    = "General"
    changelog   = "Release $Version"
    description = "All-in-one Jellyfin plugin: Netflix-style slider, quality badges, studios, themes and notifications."
    guid        = $Guid
    imagePath   = ""
    name        = "JellyFusion"
    overview    = "Unified plugin with multi-language support."
    owner       = $Owner
    targetAbi   = "10.10.0.0"
    timestamp   = $timestamp
    version     = ($Version + ".0")
}
$metaObj | ConvertTo-Json -Depth 4 | Set-Content -Path $Meta -Encoding utf8

Write-Host "==> Creating ZIP"
if (Test-Path $ZipOut) { Remove-Item $ZipOut -Force }
$dllPath = Join-Path $Pub "JellyFusion.dll"
Compress-Archive -Path $dllPath, $Meta -DestinationPath $ZipOut -Force

Write-Host "==> Computing MD5"
$md5 = (Get-FileHash -Algorithm MD5 -Path $ZipOut).Hash.ToLower()
Write-Host ("    MD5: " + $md5)

Write-Host "==> Updating manifest.json"
$manifestPath = Join-Path $Root "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$targetVersion = $Version + ".0"
$ver = $manifest[0].versions | Where-Object { $_.version -eq $targetVersion } | Select-Object -First 1
if ($ver) {
    $ver.checksum  = $md5
    $ver.timestamp = $timestamp.Replace("T"," ").Replace("Z","")
    Write-Host "    Updated existing entry for $targetVersion"
} else {
    Write-Warning "manifest.json has no entry for version $targetVersion - leaving it untouched."
}
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding utf8

Write-Host ""
Write-Host "==> DONE"
Write-Host ("    ZIP:      " + $ZipOut)
Write-Host ("    Size:     " + (Get-Item $ZipOut).Length + " bytes")
Write-Host ("    MD5:      " + $md5)
Write-Host ("    Manifest: " + $manifestPath)
