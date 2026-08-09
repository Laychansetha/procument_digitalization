@echo off
title Create Clean IBIS RICE Deployment Package
color 0A
cls
echo ======================================================================
echo  CREATING CLEAN DEPLOYMENT PACKAGE FOR IBIS RICE SYSTEM
echo ======================================================================
echo.
echo Packaging Web Application, Mobile App (field_app) & Release APK (field_app.apk)...
echo.

powershell -Command "Compress-Archive -Path 'src', 'prisma', 'public', 'field_app\lib', 'field_app\android', 'field_app\assets', 'field_app\pubspec.yaml', 'field_app.apk', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs', 'eslint.config.mjs', 'next-env.d.ts', '.env.example', '.gitignore', 'start-production-local.bat', 'switch-to-postgresql.bat', 'reset-fresh-postgresql.bat', 'build-android-apk.bat', 'DEPLOYMENT_GUIDE.md', 'README.md' -DestinationPath 'ibis-rice-clean-deployment.zip' -Force"

echo ======================================================================
echo SUCCESS! Created clean transfer package: ibis-rice-clean-deployment.zip
echo Location: %CD%\ibis-rice-clean-deployment.zip
echo ======================================================================
echo.
