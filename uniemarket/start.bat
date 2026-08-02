@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   UNIEMARKET - Dang khoi dong...
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js tren may nay.
    echo Vui long cai dat Node.js tai https://nodejs.org roi chay lai file nay.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Day la lan dau chay, dang cai dat thu vien can thiet...
    echo Qua trinh nay co the mat vai phut, vui long doi...
    echo.
    call npm install
    if errorlevel 1 (
        echo [LOI] Cai dat that bai. Vui long kiem tra ket noi Internet roi thu lai.
        echo.
        pause
        exit /b 1
    )
)

if not exist ".env.local" (
    echo --------------------------------------------------------------
    echo [CHU Y] Chua tim thay file .env.local - chua ket noi Supabase.
    echo Web van chay o CHE DO DEMO ^(du lieu mau, khong luu that^).
    echo De bat tai khoan, don hang that va khu lam viec:
    echo   xem huong dan tung buoc trong file SETUP.md
    echo --------------------------------------------------------------
    echo.
)

echo.
echo Dang mo trinh duyet tai http://localhost:5173 ...
echo Dung dong cua so nay - hay dong no lai khi muon tat web.
echo.

start "" http://localhost:5173

call npm run dev

pause
