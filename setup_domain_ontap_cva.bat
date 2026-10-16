@echo off
chcp 65001 >nul
echo =====================================================================
echo   CẤU HÌNH TÊN MIỀN NỘI BỘ: ontap.cva (TRƯỜNG THPT/TT CHU VĂN AN)
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

echo [*] Đang thêm tên miền ontap.cva vào file C:\Windows\System32\drivers\etc\hosts ...
findstr /C:"ontap.cva" "%WINDIR%\System32\drivers\etc\hosts" >nul
if %errorLevel% neq 0 (
    echo 127.0.0.1 ontap.cva >> "%WINDIR%\System32\drivers\etc\hosts"
    echo [OK] Đã gắn 127.0.0.1 ontap.cva thành công!
) else (
    echo [i] Tên miền ontap.cva đã có sẵn trong file hosts.
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
echo        http://ontap.cva   hoặc   http://ontap.cva:3000
echo.
echo   Trong mạng nội bộ trường (WiFi/LAN), các máy khác truy cập qua:
echo        http://192.168.10.64:3000
echo =====================================================================
echo.
pause

