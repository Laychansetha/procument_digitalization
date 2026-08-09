@echo off
title IBIS RICE Operations Local Production Launcher
color 0A
cls
echo ======================================================================
echo           IBIS RICE CONSERVATION CO., LTD - LOCAL PRODUCTION
echo ======================================================================
echo.
echo [1/3] Verifying uploads directory...
if not exist "public\uploads" mkdir "public\uploads"

echo [2/3] Running automatic database migration and seed check...
call npx prisma db push --skip-generate
call npx tsx prisma/seed.ts

echo [3/3] Building optimized production server...
call npm run build

echo.
echo ======================================================================
echo SUCCESS! Starting IBIS RICE Production Server on http://localhost:3000
echo Network LAN Access: http://0.0.0.0:3000 (Available across local Wi-Fi/LAN)
echo ======================================================================
echo Press Ctrl+C at any time to stop the server.
echo.

call npm run start
pause
