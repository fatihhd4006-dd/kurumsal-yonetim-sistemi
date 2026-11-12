@echo off
chcp 65001 >nul
title Kurumsal Yonetim Sistemi - Baslatici
cd /d "%~dp0"

set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

set "HTML_PATH=%~dp0index.html"
set "DATA_PROFILE=%~dp0Veri_Profili"
set "BACKUP_DIR=%~dp0Otomatik_Yedekler"
set "UPDATER_PS1=%~dp0kaynak_kodlar\AutoUpdate.ps1"
set "BRIDGE_PS1=%~dp0kaynak_kodlar\LocalUpdateBridge.ps1"

if not exist "%DATA_PROFILE%" (
    mkdir "%DATA_PROFILE%" >nul 2>&1
)
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%" >nul 2>&1
)

:: 0. Acilista GitHub Uzerinden Otomatik Guncelleme Denetimi (Veri_Profili ve Otomatik_Yedekler Korunur)
if exist "%UPDATER_PS1%" (
    echo [Kurumsal Yonetim Sistemi] Guncellemeler denetleniyor...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%UPDATER_PS1%" -BaseDir "%BASE_DIR%"
)

:: 1. Turkce karakter ve bosluk iceren dosya yolunu gecerli file:/// URI bicimine cevir
set "KYS_HTML=%HTML_PATH%"
set "HTML_URI="
for /f "delims=" %%U in ('powershell -NoProfile -Command "[System.Uri]::new($env:KYS_HTML).AbsoluteUri"') do set "HTML_URI=%%U"
if not defined HTML_URI set "HTML_URI=%HTML_PATH%"

:: 2. Microsoft Edge veya Google Chrome Denetimi
set "TARGET_BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "TARGET_BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "TARGET_BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "TARGET_BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "TARGET_BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "TARGET_BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

:: 3. Uygulama Ici Otomatik Guncelleme Koprusu ile Pencereyi Baslat (ZIP indirmeden dogrudan guncelleme)
if defined TARGET_BROWSER (
    if exist "%BRIDGE_PS1%" (
        start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%BRIDGE_PS1%" -BaseDir "%BASE_DIR%" -BrowserExe "%TARGET_BROWSER%" -HtmlUri "%HTML_URI%" -ProfileDir "%DATA_PROFILE%"
        goto :FINISH_AND_EXIT
    )
    start "" "%TARGET_BROWSER%" --app="%HTML_URI%" --user-data-dir="%DATA_PROFILE%" --no-first-run --no-default-browser-check
    goto :FINISH_AND_EXIT
)

:: 4. Bulunamazsa varsayilan tarayiciyla ac
start "" "%HTML_PATH%"

:FINISH_AND_EXIT
(
    if exist "%~dp0Sistemi_Baslat.bat.new" move /y "%~dp0Sistemi_Baslat.bat.new" "%~dp0Sistemi_Baslat.bat" >nul 2>&1
    exit
)