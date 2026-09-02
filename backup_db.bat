@echo off
TITLE IBIS Procurement & Payment System - Backup Database
COLOR 0A
cd /d "%~dp0"

echo =========================================================
echo   IBIS Rice Procurement - Backup Database
echo =========================================================
echo.
call npx tsx scripts/backup-database.ts
pause
