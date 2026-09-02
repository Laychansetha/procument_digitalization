@echo off
TITLE IBIS Procurement and Payment System - Production Server (Port 3000)
COLOR 0A
cd /d "%~dp0"

echo =========================================================
echo   IBIS Rice Procurement and Payment System - Production
echo =========================================================
echo.
echo [1/2] Verifying PostgreSQL Database...
if exist .\node_modules\.bin\tsx.cmd (
    call .\node_modules\.bin\tsx.cmd scripts/check-counts.ts
) else (
    call npx --yes tsx scripts/check-counts.ts
)
if %errorlevel% neq 0 (
    echo WARNING: Database verification check failed. Please make sure PostgreSQL service is started.
    pause
)

echo.
echo [2/2] Checking Production Build (.next)...
if not exist .next (
    echo Production build directory not found. Compiling app now...
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Production build failed!
        pause
        exit /b 1
    )
)

echo.
echo Launching Web Portal Server on http://localhost:3000 ...
echo Accessible on local network at http://0.0.0.0:3000
echo Cloudflare Tunnel Public Address: https://payment.icsserver.com
echo Press Ctrl+C to stop server.
echo.
call npm run start
pause
