@echo off
title Push to GitHub: nghiatnhcmue/cva-ontap
echo =========================================================
echo    DONG BO VA DAY CODE LEN GITHUB: nghiatnhcmue/cva-ontap
echo =========================================================
echo.
echo [*] Dang day 66 files ma nguon (sieu nhe, khong co node_modules)...
echo.
git push -u origin main --force
if %errorlevel% equ 0 (
    echo.
    echo =========================================================
    echo   [THANH CONG 100%%] Toan bo code da len GitHub!
    echo   Bay gio ban quay lai Vercel de bam Deploy la xong ngay!
    echo =========================================================
) else (
    echo.
    echo [!] Vui long xac thuc tren trinh duyet neu co popup yeu cau.
)
echo.
pause
