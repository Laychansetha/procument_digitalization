@echo off
title IBIS RICE PostgreSQL Database Setup
color 0B
cls
echo ======================================================================
echo  IBIS RICE CONSERVATION CO., LTD - POSTGRESQL DATABASE SETUP
echo ======================================================================
echo.
echo [1/4] Verifying uploads directory...
if not exist "public\uploads" mkdir "public\uploads"

echo [2/4] Verifying .env environment file...
if not exist ".env" (
    echo Creating .env file from .env.example template...
    copy ".env.example" ".env"
    echo.
    echo IMPORTANT: Please edit .env to set your PostgreSQL database connection details!
)

echo [3/4] Generating Prisma Client and Syncing Database Tables...
call npx prisma generate
call npx prisma db push
call npx tsx prisma/seed.ts

echo.
echo ======================================================================
echo SUCCESS! PostgreSQL database (ibis_db) schema and seed complete.
echo You can now start the server by running: start-production-local.bat
echo ======================================================================
echo.
pause
