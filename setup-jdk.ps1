$ProgressPreference = 'SilentlyContinue'
$url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip"
$zipPath = "$PSScriptRoot\jdk17.zip"
$targetDir = "$PSScriptRoot\jdk-17"

if (-not (Test-Path $targetDir)) {
    Write-Host "Downloading OpenJDK 17 for Gradle compatibility..."
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Write-Host "Extracting OpenJDK 17..."
    Expand-Archive -Path $zipPath -DestinationPath "$PSScriptRoot\jdk-tmp" -Force
    $inner = Get-ChildItem "$PSScriptRoot\jdk-tmp" | Select-Object -First 1
    Move-Item -Path $inner.FullName -Destination $targetDir -Force
    Remove-Item -Path $zipPath, "$PSScriptRoot\jdk-tmp" -Recurse -Force
    Write-Host "✅ OpenJDK 17 successfully installed to $targetDir"
} else {
    Write-Host "✅ OpenJDK 17 already installed."
}
