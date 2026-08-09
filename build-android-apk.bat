@echo off
title Build IBIS RICE Release Android APK (field_app.apk)
color 0B
cls
echo ======================================================================
echo  BUILDING RELEASE ANDROID APK FOR IBIS RICE FIELD APPLICATION
echo ======================================================================
echo.

if exist "C:\Users\laych\Documents\digitalization_payment_dev\jdk-17" (
    set "JAVA_HOME=C:\Users\laych\Documents\digitalization_payment_dev\jdk-17"
)

cd field_app

echo Fetching Flutter packages...
call C:\flutter\bin\flutter.bat pub get

echo Building Standalone Release APK...
call C:\flutter\bin\flutter.bat build apk --release --no-tree-shake-icons

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    copy /y "build\app\outputs\flutter-apk\app-release.apk" "..\field_app.apk"
    echo.
    echo ======================================================================
    echo SUCCESS! Standalone Release APK created successfully: field_app.apk
    echo Location: %CD%\..\field_app.apk
    echo ======================================================================
    echo.
    echo Copy 'field_app.apk' to your Android tablet and install directly.
) else (
    echo.
    echo ⚠️ Build note: If Android SDK is not detected on this host machine,
    echo please open Flutter on a computer with Android Studio installed to compile the APK.
)

pause
