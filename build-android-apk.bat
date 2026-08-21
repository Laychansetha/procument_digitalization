@echo off
setlocal

REM Resolve the project root as the folder containing this script
set "PROJECT_ROOT=%~dp0"
set "FIELD_APP=%PROJECT_ROOT%field_app"

echo ======================================================================
echo BUILDING RELEASE ANDROID APK FOR IBIS RICE FIELD APPLICATION
echo ======================================================================
echo.
echo Project Root: %PROJECT_ROOT%
echo.

REM Set JAVA_HOME to project JDK 17 if it exists
if exist "%PROJECT_ROOT%jdk-17\bin\java.exe" (
    set "JAVA_HOME=%PROJECT_ROOT%jdk-17"
    echo Using project JDK: %PROJECT_ROOT%jdk-17
) else if exist "%PROJECT_ROOT%jdk-17-real\bin\java.exe" (
    set "JAVA_HOME=%PROJECT_ROOT%jdk-17-real"
    echo Using embedded JDK: %PROJECT_ROOT%jdk-17-real
) else (
    echo Using system-installed JDK (JAVA_HOME=%JAVA_HOME%)
)

echo [1/3] Moving into Flutter project folder...
cd /d "%FIELD_APP%"

echo [2/3] Fetching Flutter packages...
flutter pub get
if errorlevel 1 ( echo ERROR: flutter pub get failed. Make sure Flutter is on your PATH. & pause & exit /b 1 )

echo [3/3] Building Standalone Release APK...
flutter build apk --release --no-tree-shake-icons
if errorlevel 1 ( echo ERROR: flutter build apk failed. & pause & exit /b 1 )

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    copy /y "build\app\outputs\flutter-apk\app-release.apk" "..\field_app.apk"
    echo.
    echo ======================================================================
    echo SUCCESS! Standalone Release APK created: field_app.apk
    echo Location: %PROJECT_ROOT%field_app.apk
    echo ======================================================================
) else (
    echo.
    echo BUILD FAILED or output not found.
)

endlocal
