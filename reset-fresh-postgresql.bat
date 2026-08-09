@echo off
title IBIS RICE Clean Database Reset
color 0C
cls
echo ======================================================================
echo  IBIS RICE CONSERVATION CO., LTD - CLEAN DATABASE RESET AND SEED
echo ======================================================================
echo.
echo Cleaning uploads directory, build cache, resetting database schema, and seeding initial master data...
echo.

echo [1/5] Cleaning uploads directory and Next.js build cache...
if not exist "public\uploads" (
    mkdir "public\uploads"
) else (
    del /q "public\uploads\*.*" 2>nul
)
if exist ".next" rmdir /s /q ".next" 2>nul

echo [2/5] Verifying .env environment file...
if not exist ".env" (
    echo Creating .env file from .env.example template...
    copy ".env.example" ".env"
)

echo [3/5] Generating Prisma Client...
call npx prisma generate

echo [4/5] Resetting Database Schema and Re-creating Tables...
call npx prisma db push --force-reset

echo [5/5] Seeding Master Configuration and Default Accounts...
call npx tsx prisma/seed.ts

echo.
echo ======================================================================
echo  SUCCESS! PostgreSQL database has been completely reset and seeded.
echo ======================================================================
echo  Default User Accounts:
echo    - Field Inspector:    field@ibisrice.org    (Pass: Ibis2026!)
echo    - Warehouse Operator: warehouse@ibisrice.org (Pass: Ibis2026!)
echo    - Finance Officer:    finance@ibisrice.org   (Pass: Ibis2026!)
echo    - System Admin:       admin@ibisrice.org     (Pass: Ibis2026!)
echo ======================================================================
echo.
