@echo off
title Create Clean IBIS RICE Deployment Package
color 0A
cls
echo ======================================================================
echo  CREATING CLEAN DEPLOYMENT PACKAGE FOR IBIS RICE SYSTEM
echo ======================================================================
echo.
echo Packaging Web Application, Release APK & Deployment Assets into ibis-rice-deployment.zip...
echo.

powershell -Command "Compress-Archive -Path 'src', 'prisma', 'public', 'ibis_rice_field_app', 'ibis-rice-field-app-v1.0.apk', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs', 'eslint.config.mjs', 'next-env.d.ts', '.env.example', '.gitignore', 'start-production-local.bat', 'switch-to-postgresql.bat', 'start-production.sh', 'build-android-apk.bat', 'DEPLOYMENT_GUIDE.md', 'README.md' -DestinationPath 'ibis-rice-deployment.zip' -Force"

echo ======================================================================
echo SUCCESS! Created clean transfer package: ibis-rice-deployment.zip
echo Location: %CD%\ibis-rice-deployment.zip
echo ======================================================================
echo.
