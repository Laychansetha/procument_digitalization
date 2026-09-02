@echo off
TITLE IBIS Procurement and Payment System - Development Server (Port 3000)
COLOR 0E
cd /d "%~dp0"

echo =========================================================
echo   IBIS Rice Procurement and Payment System - Dev Server
echo =========================================================
echo.
echo [1/2] Verifying PostgreSQL Database...
if exist .\node_modules\.bin\tsx.cmd (
    call .\node_modules\.bin\tsx.cmd scripts/check-counts.ts
) else (
    call npx --yes tsx scripts/check-counts.ts
)

echo.
echo [2/2] Launching Web Portal Dev Server on http://localhost:3000 ...
echo Accessible on local network at http://0.0.0.0:3000
echo Cloudflare Tunnel Public Address: https://payment.icsserver.com
echo Press Ctrl+C to stop server.
echo.
call npm run dev
pause
