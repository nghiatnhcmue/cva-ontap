@echo off
title Push to GitHub: nghiatnhcmue/cva-ontap
echo =========================================================
echo    DONG BO VA DAY CODE LEN GITHUB: nghiatnhcmue/cva-ontap
echo =========================================================
echo.
echo [*] Dang thuc hien day code len GitHub...
echo.
git push -u origin main --force
if %errorlevel% equ 0 (
    echo.
    echo =========================================================
    echo   [THANH CONG] Toan bo ma nguon da len GitHub!
    echo   Bay gio ban quay lai Vercel de bam Deploy la xong ngay!
    echo =========================================================
) else (
    echo.
    echo [!] Vui long dang nhap tren cua so GitHub neu co popup yeu cau.
)
echo.
pause
