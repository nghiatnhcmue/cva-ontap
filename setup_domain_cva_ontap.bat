@echo off
chcp 65001 >nul
title Thiết Lập Tên Miền cva-ontap
echo =====================================================================
echo   CẤU HÌNH TÊN MIỀN NỘI BỘ: cva-ontap (TTGDTX CHU VĂN AN)
echo =====================================================================
echo.

:: Kiểm tra quyền Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Vui lòng bấm chuột phải vào file này và chọn "Run as administrator" (Chạy với quyền Quản trị viên)!
    echo.
    pause
    exit /b 1
)

echo [*] Đang thêm tên miền cva-ontap vào file C:\Windows\System32\drivers\etc\hosts ...
findstr /C:"cva-ontap" "%WINDIR%\System32\drivers\etc\hosts" >nul
if %errorLevel% neq 0 (
    echo 127.0.0.1 cva-ontap >> "%WINDIR%\System32\drivers\etc\hosts"
    echo [OK] Đã gắn 127.0.0.1 cva-ontap thành công!
) else (
    echo [i] Tên miền cva-ontap đã có sẵn trong file hosts.
)

echo [*] Cấu hình Port Proxy: ánh xạ Cổng 80 sang Cổng 3000 ...
netsh interface portproxy add v4tov4 listenport=80 listenaddress=127.0.0.1 connectport=3000 connectaddress=127.0.0.1 >nul
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=3000 connectaddress=127.0.0.1 >nul
echo [OK] Đã ánh xạ thành công! Từ bây giờ bạn không cần gõ :3000 nữa.

echo.
echo =====================================================================
echo   HOÀN TẤT THIẾT LẬP!
echo   Mở trình duyệt bất kỳ (Chrome/Edge/Cốc Cốc) và truy cập:
echo.
echo        http://cva-ontap   hoặc   http://cva-ontap:3000
echo.
echo   Trong mạng nội bộ trường (WiFi/LAN), các máy khác truy cập qua:
echo        http://192.168.10.64:3000
echo =====================================================================
echo.
pause

