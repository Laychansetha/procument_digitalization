@echo off
title Build IBIS RICE Release Android APK
color 0B
cls
echo ======================================================================
echo  BUILDING RELEASE ANDROID APK FOR IBIS RICE FIELD APPLICATION
echo ======================================================================
echo.

cd ibis_rice_field_app

echo Fetching Flutter packages...
call flutter pub get

echo Building Standalone Release APK...
call flutter build apk --release

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo.
    echo ======================================================================
    echo SUCCESS! Standalone Release APK created successfully!
    echo Location: ibis_rice_field_app\build\app\outputs\flutter-apk\app-release.apk
    echo ======================================================================
    echo.
    echo Copy 'app-release.apk' to your Android tablet and install directly.
) else (
    echo.
    echo ⚠️ Build note: If Android SDK is not detected on this host machine,
    echo please open Flutter on a computer with Android Studio installed to compile the APK.
)

pause
