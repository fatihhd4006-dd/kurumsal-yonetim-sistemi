@echo off
chcp 65001 >nul
title Kurumsal Yonetim Sistemi - Butonlu & Sade Excel Guncelleyici
echo ============================================================
echo   KURUMSAL YONETIM SISTEMI - SADE & BUTONLU EXCEL MOTORU
echo ============================================================
echo.
echo [1/2] Excel dosyaniz butonlu ve goz yormayan arayuzle derleniyor...
set "SCRIPT_PATH=%~dp0build_clean_button_excel.ps1"
if not exist "%SCRIPT_PATH%" (
    set "SCRIPT_PATH=%~dp0scratch\build_clean_button_excel.ps1"
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"
if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================================
    echo [BASARILI] Excel dosyaniz Masaustune ve F: surucusune kaydedildi!
    echo Konum: %USERPROFILE%\Desktop\Kurumsal_Yonetim_Sistemi.xlsx
    echo ============================================================
) else (
    echo.
    echo [HATA] Excel olusturma sirasinda bir hata meydana geldi.
)
echo.
timeout /t 5 >nul
