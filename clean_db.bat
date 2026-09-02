@echo off
TITLE IBIS Procurement and Payment System - Reset Database
COLOR 0C
cd /d "%~dp0"

echo =========================================================
echo   WARNING: Clean and Reset Database to Master State
echo =========================================================
echo.
echo This will remove test transaction data and reset to fresh state while preserving master settings.
pause

call npx tsx scripts/clean-database.ts
pause
