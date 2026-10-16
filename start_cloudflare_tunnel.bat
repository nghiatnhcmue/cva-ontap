@echo off
chcp 65001 >nul
title Cloudflare Tunnel - ontap.cva (Free 100%%)
echo =====================================================================
echo    KHỞI CHẠY PUBLIC TUNNEL QUA CLOUDFLARE (MIỄN PHÍ 100%%, KHÔNG GIỚI HẠN)
echo =====================================================================
echo.
echo [*] Đang kết nối mạng Cloudflare Edge siêu tốc...
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause

