@echo off
chcp 65001 >nul
title Kurumsal Yönetim Sistemi - Başlatıcı
cd /d "%~dp0"

set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

set "HTML_PATH=%~dp0index.html"
set "DATA_PROFILE=%~dp0Veri_Profili"
set "BACKUP_DIR=%~dp0Otomatik_Yedekler"
set "UPDATER_PS1=%~dp0kaynak_kodlar\AutoUpdate.ps1"

if not exist "%DATA_PROFILE%" (
    mkdir "%DATA_PROFILE%" >nul 2>&1
)
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%" >nul 2>&1
)

:: 0. GitHub Üzerinden Otomatik Güncelleme Denetimi (Veri_Profili ve Otomatik_Yedekler Korunur)
if exist "%UPDATER_PS1%" (
    echo [Kurumsal Yönetim Sistemi] Güncellemeler denetleniyor...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%UPDATER_PS1%" -BaseDir "%BASE_DIR%"
)

:: 1. Microsoft Edge Denetimi (Tüm Windows 10 & 11'de Yüklüdür)
set "EDGE_EXE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

:: 2. Google Chrome Denetimi
set "CHROME_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

:: 3. Uygulama Modunda Pencere Olarak Başlat + Bekleyen Başlatıcı Güncellemesini Uygula
if defined EDGE_EXE (
    start "" "%EDGE_EXE%" --app="file:///%HTML_PATH%" --user-data-dir="%DATA_PROFILE%" --no-first-run --no-default-browser-check
    goto :FINISH_AND_EXIT
)

if defined CHROME_EXE (
    start "" "%CHROME_EXE%" --app="file:///%HTML_PATH%" --user-data-dir="%DATA_PROFILE%" --no-first-run --no-default-browser-check
    goto :FINISH_AND_EXIT
)

:: 4. Tarayıcı bulunamazsa varsayılan tarayıcıyla aç
start "" "%HTML_PATH%"

:FINISH_AND_EXIT
(
    if exist "%~dp0Sistemi_Baslat.bat.new" move /y "%~dp0Sistemi_Baslat.bat.new" "%~dp0Sistemi_Baslat.bat" >nul 2>&1
    exit
)
