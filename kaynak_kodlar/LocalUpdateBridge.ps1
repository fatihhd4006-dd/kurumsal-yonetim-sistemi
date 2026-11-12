param(
    [Parameter(Mandatory = $true)] [string]$BaseDir,
    [Parameter(Mandatory = $true)] [string]$BrowserExe,
    [Parameter(Mandatory = $true)] [string]$HtmlUri,
    [Parameter(Mandatory = $true)] [string]$ProfileDir
)

$ErrorActionPreference = 'SilentlyContinue'
$BaseDir = $BaseDir.TrimEnd('\', '/')
$ProfileDir = $ProfileDir.TrimEnd('\', '/')
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$Token = [Guid]::NewGuid().ToString('N')

# Loopback 127.0.0.1 uzerinde bos port ac (Firewall penceresi cikarmaz, .exe gerektirmez)
$tcp = $null
foreach ($tryPort in @(18540, 18541, 18542, 0)) {
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $tryPort)
        $candidate.Start()
        $tcp = $candidate
        break
    } catch {
        $tcp = $null
    }
}
if (-not $tcp) { exit 1 }

$Port = $tcp.LocalEndpoint.Port
$AppUrl = "$HtmlUri#bridge=$Port&token=$Token"

function Get-ProfileBrowserProcesses {
    param([string]$TargetProfile)
    $all = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
    if (-not $all) { return @() }
    return @($all | Where-Object {
        ($_.Name -ieq 'chrome.exe' -or $_.Name -ieq 'msedge.exe') -and
        $_.CommandLine -and
        ($_.CommandLine.IndexOf($TargetProfile, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
    })
}

function Start-ManagedBrowser {
    $argList = @(
        "--app=`"$AppUrl`"",
        "--user-data-dir=`"$ProfileDir`"",
        "--no-first-run",
        "--no-default-browser-check"
    )
    Start-Process -FilePath $BrowserExe -ArgumentList $argList | Out-Null
}

function Stop-ManagedBrowser {
    $procs = Get-ProfileBrowserProcesses -TargetProfile $ProfileDir
    foreach ($p in $procs) {
        try {
            $procObj = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
            if ($procObj -and $procObj.MainWindowHandle -ne [IntPtr]::Zero) {
                $null = $procObj.CloseMainWindow()
            }
        } catch {}
    }

    $deadline = [DateTime]::UtcNow.AddSeconds(2.5)
    while ([DateTime]::UtcNow -lt $deadline) {
        $left = Get-ProfileBrowserProcesses -TargetProfile $ProfileDir
        if ($left.Count -eq 0) { break }
        Start-Sleep -Milliseconds 150
    }

    $remaining = Get-ProfileBrowserProcesses -TargetProfile $ProfileDir
    foreach ($p in $remaining) {
        try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
    }
    Start-Sleep -Milliseconds 350
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode = 200,
        [string]$StatusText = 'OK',
        [string]$Body = '',
        [string]$ContentType = 'application/json; charset=utf-8'
    )
    $bodyBytes = $utf8NoBom.GetBytes($Body)
    $hdrText = @(
        "HTTP/1.1 $StatusCode $StatusText",
        "Content-Type: $ContentType",
        "Access-Control-Allow-Origin: *",
        "Access-Control-Allow-Methods: GET, POST, OPTIONS",
        "Access-Control-Allow-Headers: Content-Type",
        "Access-Control-Allow-Private-Network: true",
        "Cache-Control: no-store",
        "Content-Length: $($bodyBytes.Length)",
        "Connection: close",
        "",
        ""
    ) -join "`r`n"
    $hdrBytes = $utf8NoBom.GetBytes($hdrText)
    $Stream.Write($hdrBytes, 0, $hdrBytes.Length)
    if ($bodyBytes.Length -gt 0) {
        $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
    }
    $Stream.Flush()
}

# Ilk tarayici penceresini ac
Start-ManagedBrowser
$launchTime = [DateTime]::UtcNow
$lastWatchdog = [DateTime]::UtcNow
$seenBrowserOnce = $false

try {
    while ($true) {
        if ($tcp.Pending()) {
            $client = $tcp.AcceptTcpClient()
            $shouldRelaunch = $false
            try {
                $stream = $client.GetStream()
                $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 2048, $true)
                $reqLine = $reader.ReadLine()
                while ($true) {
                    $h = $reader.ReadLine()
                    if ([string]::IsNullOrEmpty($h)) { break }
                }

                if ($reqLine -match '^OPTIONS\s+') {
                    Send-HttpResponse -Stream $stream -StatusCode 204 -StatusText 'No Content' -Body ''
                } elseif ($reqLine -match '^(GET|POST)\s+([^\s]+)') {
                    $method = $matches[1]
                    $rawUrl = $matches[2]
                    $parts = $rawUrl.Split('?', 2)
                    $path = $parts[0]
                    $query = if ($parts.Count -gt 1) { $parts[1] } else { '' }

                    $reqToken = ''
                    if ($query -match '(?:^|&)token=([^&]+)') {
                        $reqToken = [System.Uri]::UnescapeDataString($matches[1])
                    }

                    if ($reqToken -ne $Token) {
                        Send-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -Body '{"ok":false,"error":"Yetkisiz erisim"}'
                    } elseif ($path -eq '/ping' -and $method -eq 'GET') {
                        $localVer = '1.5.1'
                        try {
                            $vObj = Get-Content (Join-Path $BaseDir 'version.json') -Raw -Encoding UTF8 | ConvertFrom-Json
                            if ($vObj.version) { $localVer = [string]$vObj.version }
                        } catch {}
                        $json = "{`"ok`":true,`"bridge`":`"ready`",`"version`":`"$localVer`"}"
                        Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $json
                    } elseif ($path -eq '/apply-update' -and $method -eq 'POST') {
                        $updater = Join-Path $BaseDir 'kaynak_kodlar\AutoUpdate.ps1'
                        if (-not (Test-Path $updater)) {
                            Send-HttpResponse -Stream $stream -StatusCode 500 -StatusText 'Error' -Body '{"ok":false,"error":"AutoUpdate.ps1 bulunamadi"}'
                        } else {
                            $oldVer = ''
                            try {
                                $vOld = Get-Content (Join-Path $BaseDir 'version.json') -Raw -Encoding UTF8 | ConvertFrom-Json
                                if ($vOld.version) { $oldVer = [string]$vOld.version }
                            } catch {}
                            $outLines = & powershell -NoProfile -ExecutionPolicy Bypass -File $updater -BaseDir $BaseDir -DirectBatReplace 2>&1
                            $newVer = ''
                            try {
                                $vObj = Get-Content (Join-Path $BaseDir 'version.json') -Raw -Encoding UTF8 | ConvertFrom-Json
                                if ($vObj.version) { $newVer = [string]$vObj.version }
                            } catch {}
                            $applied = ($newVer -and $newVer -ne $oldVer)
                            $appliedStr = if ($applied) { 'true' } else { 'false' }
                            $okJson = "{`"ok`":true,`"applied`":$appliedStr,`"oldVersion`":`"$oldVer`",`"version`":`"$newVer`"}"
                            Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $okJson
                        }
                    } elseif ($path -eq '/relaunch' -and $method -eq 'POST') {
                        Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body '{"ok":true,"relaunching":true}'
                        $shouldRelaunch = $true
                    } else {
                        Send-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Body '{"ok":false}'
                    }
                } else {
                    Send-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Body '{"ok":false}'
                }
            } catch {
            } finally {
                try { $client.Close() } catch {}
            }

            if ($shouldRelaunch) {
                Start-Sleep -Milliseconds 250
                Stop-ManagedBrowser
                Start-ManagedBrowser
                $launchTime = [DateTime]::UtcNow
                $seenBrowserOnce = $false
            }
        } else {
            Start-Sleep -Milliseconds 80
            if (([DateTime]::UtcNow - $lastWatchdog).TotalSeconds -ge 3) {
                $lastWatchdog = [DateTime]::UtcNow
                $active = Get-ProfileBrowserProcesses -TargetProfile $ProfileDir
                if ($active.Count -gt 0) {
                    $seenBrowserOnce = $true
                } elseif ($seenBrowserOnce -or (([DateTime]::UtcNow - $launchTime).TotalSeconds -ge 12)) {
                    # Kullanici program penceresini kapatti; kopruyu temizce sonlandir
                    break
                }
            }
        }
    }
} finally {
    try { $tcp.Stop() } catch {}
}
