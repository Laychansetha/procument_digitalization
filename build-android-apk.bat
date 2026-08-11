@echo off
set "JAVA_HOME=C:\Users\laych\Documents\digitalization_payment_dev\jdk-17-real"
set "PATH=C:\Users\laych\Documents\digitalization_payment_dev\jdk-17-real\bin;%PATH%"

echo ======================================================================
echo BUILDING RELEASE ANDROID APK FOR IBIS RICE FIELD APPLICATION
echo ======================================================================

cd /d "C:\Users\laych\Documents\digitalization_payment_dev\field_app"

echo Fetching Flutter packages...
call C:\flutter\bin\flutter.bat pub get

echo Building Standalone Release APK...
call C:\flutter\bin\flutter.bat build apk --release --no-tree-shake-icons

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    copy /y "build\app\outputs\flutter-apk\app-release.apk" "..\field_app.apk"
    echo.
    echo ======================================================================
    echo SUCCESS! Standalone Release APK created successfully: field_app.apk
    echo Location: C:\Users\laych\Documents\digitalization_payment_dev\field_app.apk
    echo ======================================================================
) else (
    echo.
    echo BUILD FAILED or output not found.
)
