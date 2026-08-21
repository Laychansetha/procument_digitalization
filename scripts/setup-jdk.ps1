$ErrorActionPreference = 'Stop'
$destRoot = "C:\Users\laych\Documents\digitalization_payment_dev"
$jdkTarget = Join-Path $destRoot "jdk-17"
$zipPath = Join-Path $destRoot "jdk-17.zip"
$url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"

Write-Host "Downloading Eclipse Temurin OpenJDK 17..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting JDK 17..."
Expand-Archive -Path $zipPath -DestinationPath $destRoot -Force
Remove-Item $zipPath -Force

$extracted = Get-ChildItem $destRoot -Directory | Where-Object { $_.Name -like "jdk-17*" -and $_.Name -ne "jdk-17" } | Select-Object -First 1
if ($extracted -ne $null) {
    if (Test-Path $jdkTarget) {
        Remove-Item $jdkTarget -Recurse -Force
    }
    Rename-Item -Path $extracted.FullName -NewName "jdk-17" -Force
}

$javaExe = Join-Path $jdkTarget "bin\java.exe"
if (Test-Path $javaExe) {
    Write-Host "✅ JDK 17 successfully installed!"
    & $javaExe -version
} else {
    Write-Error "JDK 17 installation failed."
}
