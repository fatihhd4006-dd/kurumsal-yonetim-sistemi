param(
    [string]$SourceDir = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Kurumsal_Yonetim_Sistemi'),
    [string]$GitHubDir = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'GitHub_Yukleme_Paketi'),
    [string]$PortableZip = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Kurumsal_Yonetim_Sistemi_Portable.zip'),
    [string]$StandaloneOgrenciHtml = (Join-Path (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Yeni klasör (2)') 'ogrenci_takip_paneli.html')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$SourceDir = $SourceDir.TrimEnd('\', '/')
if (-not (Test-Path (Join-Path $SourceDir 'index.html')) -or -not (Test-Path (Join-Path $SourceDir 'version.json'))) {
    throw "Kaynak klasorde index.html veya version.json bulunamadi: $SourceDir"
}

$verObj = Get-Content (Join-Path $SourceDir 'version.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$verStr = if ($verObj.version) { [string]$verObj.version } else { '1.0.0' }

$excludedTop = @('veri_profili', 'otomatik_yedekler', '.git', '.github')

if (Test-Path $GitHubDir) {
    Remove-Item -Path $GitHubDir -Recurse -Force
}
New-Item -ItemType Directory -Path $GitHubDir -Force | Out-Null

$allItems = Get-ChildItem -Path $SourceDir -Force
foreach ($entry in $allItems) {
    $lowerName = $entry.Name.ToLowerInvariant()
    if ($excludedTop -contains $lowerName) { continue }
    if ($lowerName.StartsWith('__')) { continue }
    if ($lowerName.EndsWith('.zip') -or $lowerName.EndsWith('.tmp') -or $lowerName.EndsWith('.bat.new')) { continue }

    $destPath = Join-Path $GitHubDir $entry.Name
    if ($entry.PSIsContainer) {
        Copy-Item -Path $entry.FullName -Destination $destPath -Recurse -Force
    } else {
        Copy-Item -Path $entry.FullName -Destination $destPath -Force
    }
}

# Portable ZIP olustur (kurumlarin tek tıkla acmasi icin Kurumsal_Yonetim_Sistemi alt klasoruyle)
$tempStage = Join-Path ([System.IO.Path]::GetTempPath()) ('kys_pkg_' + [Guid]::NewGuid().ToString('N'))
try {
    $stageInner = Join-Path $tempStage 'Kurumsal_Yonetim_Sistemi'
    New-Item -ItemType Directory -Path $stageInner -Force | Out-Null

    Get-ChildItem -Path $GitHubDir -Force | ForEach-Object {
        $dest = Join-Path $stageInner $_.Name
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $dest -Force
        }
    }

    if (Test-Path $PortableZip) {
        Remove-Item -Path $PortableZip -Force
    }
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $tempStage,
        $PortableZip,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )
} finally {
    if (Test-Path $tempStage) {
        Remove-Item -Path $tempStage -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Bagimsiz Ogrenci Takip Paneli dosyasini ve tasinabilir ZIP paketini hazirla
$StandaloneDir = Split-Path -Path $StandaloneOgrenciHtml -Parent
$OgrenciPortableZip = Join-Path $StandaloneDir 'Ogrenci_Takip_Paneli_Portable.zip'

if ($StandaloneOgrenciHtml -and (Test-Path $StandaloneOgrenciHtml)) {
    Copy-Item -Path $StandaloneOgrenciHtml -Destination (Join-Path $GitHubDir 'ogrenci_takip_paneli.html') -Force

    $ogrTempStage = Join-Path ([System.IO.Path]::GetTempPath()) ('ogr_pkg_' + [Guid]::NewGuid().ToString('N'))
    try {
        $ogrStageInner = Join-Path $ogrTempStage 'Ogrenci_Takip_Paneli'
        New-Item -ItemType Directory -Path $ogrStageInner -Force | Out-Null

        Copy-Item -Path $StandaloneOgrenciHtml -Destination (Join-Path $ogrStageInner 'ogrenci_takip_paneli.html') -Force
        foreach ($extraFile in @('Ogrenci_Panelini_Baslat.bat', 'Ogrenci_Guncelle.ps1', 'Beni_Oku.txt')) {
            $srcExtra = Join-Path $StandaloneDir $extraFile
            if (Test-Path $srcExtra) {
                Copy-Item -Path $srcExtra -Destination (Join-Path $ogrStageInner $extraFile) -Force
            }
        }

        if (Test-Path $OgrenciPortableZip) {
            Remove-Item -Path $OgrenciPortableZip -Force
        }
        [System.IO.Compression.ZipFile]::CreateFromDirectory(
            $ogrTempStage,
            $OgrenciPortableZip,
            [System.IO.Compression.CompressionLevel]::Optimal,
            $false
        )
        Copy-Item -Path $OgrenciPortableZip -Destination (Join-Path $GitHubDir 'Ogrenci_Takip_Paneli_Portable.zip') -Force
    } finally {
        if (Test-Path $ogrTempStage) {
            Remove-Item -Path $ogrTempStage -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

$ghCount = (Get-ChildItem -Path $GitHubDir -File -Recurse).Count
$zipSizeMb = [math]::Round(((Get-Item $PortableZip).Length / 1MB), 2)
$ogrZipSizeKb = if (Test-Path $OgrenciPortableZip) { [math]::Round(((Get-Item $OgrenciPortableZip).Length / 1KB), 1) } else { 0 }

Write-Host ""
Write-Host "========================================================"
Write-Host " [BASARILI] Bulut ve Kurum Paketleri Guncellendi! (v$verStr)"
Write-Host " - GitHub Klasoru     : $GitHubDir ($ghCount dosya)"
Write-Host " - Kurumsal ZIP       : $PortableZip ($zipSizeMb MB)"
Write-Host " - Ogrenci Paneli ZIP : $OgrenciPortableZip ($ogrZipSizeKb KB)"
Write-Host " - Veri_Profili ve Otomatik_Yedekler haric tutuldu."
Write-Host "========================================================"
