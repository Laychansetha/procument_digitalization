@echo off
TITLE IBIS Procurement and Payment System - Automated Windows Setup
COLOR 0B
echo =========================================================
echo   IBIS Rice Procurement and Payment System - Desktop Setup
echo =========================================================
echo.
cd /d "%~dp0"

echo [1/7] Checking Node.js installation...
cmd /c node --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please download and install Node.js (LTS version) from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/7] Verifying Environment Configuration (.env)...
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo NOTE: Created default .env file.
    echo If your local PostgreSQL password is NOT "PostgreSQL-Dev-Field-2026",
    echo please edit the DATABASE_URL in .env before continuing.
)

echo.
echo [3/7] Verifying Node Dependencies (node_modules)...
if not exist node_modules (
    echo Installing node dependencies... This may take 1-2 minutes.
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed! Please check internet connection.
        pause
        exit /b 1
    )
)

echo.
echo [4/7] Generating Prisma ORM Client...
if exist .\node_modules\.bin\prisma.cmd (
    call .\node_modules\.bin\prisma.cmd generate
) else (
    call npm run prisma:generate
)
if %errorlevel% neq 0 (
    echo ERROR: Prisma client generation failed!
    pause
    exit /b 1
)

echo.
echo [5/7] Verifying & Creating PostgreSQL Database (ibis_db)...
if exist .\node_modules\.bin\tsx.cmd (
    call .\node_modules\.bin\tsx.cmd scripts/ensure-db.ts
) else (
    call npx --yes tsx scripts/ensure-db.ts
)

echo.
echo [6/7] Syncing Database Schema with PostgreSQL...
if exist .\node_modules\.bin\prisma.cmd (
    call .\node_modules\.bin\prisma.cmd db push
) else (
    call npm run prisma:push
)
if %errorlevel% neq 0 (
    echo.
    echo =========================================================
    echo ERROR: Could not connect to PostgreSQL database on port 5432!
    echo Please make sure:
    echo  1. PostgreSQL service is running on this PC.
    echo  2. Password in .env matches your PostgreSQL postgres superuser password.
    echo  3. Database port 5432 is accessible.
    echo =========================================================
    pause
    exit /b 1
)

echo.
echo [7/7] Seeding Master Configuration Data & Accounts...
call npm run seed
if %errorlevel% neq 0 (
    echo ERROR: Master data seeding failed!
    pause
    exit /b 1
)

echo.
echo Compiling Production Next.js Web App...
call npm run build
if %errorlevel% neq 0 (
    echo WARNING: Production build had warnings or errors.
    echo You can still run start_dev_server.bat for testing!
)

echo.
echo =========================================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo =========================================================
echo.
echo Next Steps:
echo   - To start Production Server: Double-click start_server.bat
echo   - To start Dev Server:        Double-click start_dev_server.bat
echo.
pause
