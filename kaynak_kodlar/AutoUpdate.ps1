param(
    [Parameter(Mandatory = $true)]
    [string]$BaseDir,
    [switch]$DirectBatReplace
)

$ErrorActionPreference = "Stop"

# GitHub Kaynak Ayarlari
$GitHubUser   = "fatihhd4006-dd"
$GitHubRepo   = "kurumsal-yonetim-sistemi"
$GitHubBranch = "main"

$BaseDir = $BaseDir.TrimEnd('\', '/')
$Nonce = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$ManifestUrl = "https://raw.githubusercontent.com/$GitHubUser/$GitHubRepo/$GitHubBranch/version.json?t=$Nonce"
$DefaultZipUrl = "https://github.com/$GitHubUser/$GitHubRepo/archive/refs/heads/$GitHubBranch.zip"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls
} catch {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

function Compare-SemVer {
    param([string]$RemoteVer, [string]$LocalVer)
    $rClean = ($RemoteVer -replace '[^0-9.]', '').Split('.', [System.StringSplitOptions]::RemoveEmptyEntries)
    $lClean = ($LocalVer -replace '[^0-9.]', '').Split('.', [System.StringSplitOptions]::RemoveEmptyEntries)
    $max = [Math]::Max($rClean.Count, $lClean.Count)
    for ($i = 0; $i -lt $max; $i++) {
        $r = 0; $l = 0
        if ($i -lt $rClean.Count) { [void][int]::TryParse($rClean[$i], [ref]$r) }
        if ($i -lt $lClean.Count) { [void][int]::TryParse($lClean[$i], [ref]$l) }
        if ($r -gt $l) { return 1 }
        if ($r -lt $l) { return -1 }
    }
    return 0
}

function Get-HttpUtf8Text {
    param([string]$Url, [int]$TimeoutMs = 4000)
    $req = [System.Net.HttpWebRequest]::Create($Url)
    $req.Method = "GET"
    $req.Timeout = $TimeoutMs
    $req.ReadWriteTimeout = $TimeoutMs
    $req.UserAgent = "KurumsalYonetimUpdater/1.5"
    $req.CachePolicy = New-Object System.Net.Cache.RequestCachePolicy([System.Net.Cache.RequestCacheLevel]::NoCacheNoStore)
    $resp = $req.GetResponse()
    try {
        $stream = $resp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        try {
            return $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
            $stream.Dispose()
        }
    } finally {
        $resp.Close()
    }
}

function Download-FileWithTimeout {
    param([string]$Url, [string]$DestPath, [int]$TimeoutMs = 30000)
    $req = [System.Net.HttpWebRequest]::Create($Url)
    $req.Method = "GET"
    $req.Timeout = $TimeoutMs
    $req.ReadWriteTimeout = $TimeoutMs
    $req.AllowAutoRedirect = $true
    $req.UserAgent = "KurumsalYonetimUpdater/1.5"
    $resp = $req.GetResponse()
    try {
        $inStream = $resp.GetResponseStream()
        $outStream = [System.IO.File]::Create($DestPath)
        try {
            $inStream.CopyTo($outStream)
        } finally {
            $outStream.Dispose()
            $inStream.Dispose()
        }
    } finally {
        $resp.Close()
    }
}

$tempZip = Join-Path ([System.IO.Path]::GetTempPath()) ("kys_upd_" + [Guid]::NewGuid().ToString("N") + ".zip")
$tempExtract = Join-Path ([System.IO.Path]::GetTempPath()) ("kys_ext_" + [Guid]::NewGuid().ToString("N"))

try {
    # 1. Yerel surum bilgisini oku
    $localVer = "1.0.0"
    $localVerPath = Join-Path $BaseDir "version.json"
    if (Test-Path $localVerPath) {
        try {
            $localObj = Get-Content -Path $localVerPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($localObj.version) { $localVer = [string]$localObj.version }
        } catch {}
    }

    # 2. GitHub uzerinden uzak version.json kontrolu (max 4 sn)
    $remoteText = Get-HttpUtf8Text -Url $ManifestUrl -TimeoutMs 4000
    $remoteObj = $remoteText | ConvertFrom-Json
    if (-not $remoteObj -or -not $remoteObj.version) {
        exit 0
    }

    $remoteVer = [string]$remoteObj.version
    if ((Compare-SemVer -RemoteVer $remoteVer -LocalVer $localVer) -le 0) {
        Write-Host "[Guncelleme] Sisteminiz guncel (v$localVer)."
        exit 0
    }

    Write-Host "[Guncelleme] Yeni surum bulundu: v$remoteVer (Mevcut: v$localVer)"
    Write-Host "[Guncelleme] Guncel dosyalar indiriliyor, verileriniz (Veri_Profili) korunuyor..."

    $zipUrl = $DefaultZipUrl
    if ($remoteObj.downloadUrl -and ([string]$remoteObj.downloadUrl).Trim() -ne "") {
        $zipUrl = ([string]$remoteObj.downloadUrl).Trim()
    }

    # 3. ZIP paketini indir ve ayikla
    Download-FileWithTimeout -Url $zipUrl -DestPath $tempZip -TimeoutMs 35000
    if (-not (Test-Path $tempZip) -or ((Get-Item $tempZip).Length -lt 10240)) {
        Write-Host "[Guncelleme] Indirilen paket dogrulanamadi, yerel surum aciliyor."
        exit 0
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($tempZip, $tempExtract)

    # 4. Ayiklanan klasorde index.html + version.json kok dizinini bul
    $appRoot = $null
    $candidates = @($tempExtract) + (Get-ChildItem -Path $tempExtract -Directory -Recurse | Select-Object -ExpandProperty FullName)
    foreach ($dir in $candidates) {
        if ((Test-Path (Join-Path $dir "index.html")) -and (Test-Path (Join-Path $dir "version.json"))) {
            $appRoot = $dir
            break
        }
    }

    if (-not $appRoot) {
        Write-Host "[Guncelleme] Paket icinde uygulama dosyalari bulunamadi, atlandi."
        exit 0
    }

    # 5. Kurum verilerini ASLA ezmeden kod dosyalarini guncelle
    $protectedTopEntries = @("veri_profili", "otomatik_yedekler", ".git", ".github")
    $deferredFiles = @()

    $allFiles = Get-ChildItem -Path $appRoot -File -Recurse
    foreach ($file in $allFiles) {
        $relPath = $file.FullName.Substring($appRoot.Length).TrimStart('\', '/')
        $topSeg = (($relPath -split '[\\/]')[0]).ToLowerInvariant()
        if ($protectedTopEntries -contains $topSeg) { continue }
        if ($relPath -match '\.zip$') { continue }

        # version.json dosyasini en son yaz (yarim kalirsa surum artmasin)
        if ($relPath.ToLowerInvariant() -eq "version.json") {
            $deferredFiles += $file
            continue
        }

        # Calisan Sistemi_Baslat.bat dosyasini dogrudan veya .new olarak yaz
        if ($relPath.ToLowerInvariant() -eq "sistemi_baslat.bat") {
            $batDest = if ($DirectBatReplace) { Join-Path $BaseDir "Sistemi_Baslat.bat" } else { Join-Path $BaseDir "Sistemi_Baslat.bat.new" }
            try {
                Copy-Item -Path $file.FullName -Destination $batDest -Force
            } catch {}
            continue
        }

        $destFile = Join-Path $BaseDir $relPath
        $destDir = Split-Path -Path $destFile -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        try {
            Copy-Item -Path $file.FullName -Destination $destFile -Force
        } catch {
            # Tek dosya kilitliyse diger dosyalara devam et
        }
    }

    foreach ($file in $deferredFiles) {
        $relPath = $file.FullName.Substring($appRoot.Length).TrimStart('\', '/')
        $destFile = Join-Path $BaseDir $relPath
        try {
            Copy-Item -Path $file.FullName -Destination $destFile -Force
        } catch {}
    }

    Write-Host "[BASARILI] Sistem v$remoteVer surumune guncellendi! Verileriniz korundu."
    Start-Sleep -Milliseconds 900
} catch {
    # Internet yoksa veya sunucuya erisilemiyorsa sistemi bekletmeden baslat
    Write-Host "[Bilgi] Cevrimdisi mod: Guncelleme kontrolu atlandi, mevcut surum aciliyor."
} finally {
    if (Test-Path $tempZip) { Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue }
}
