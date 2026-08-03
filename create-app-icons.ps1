Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\laych\Documents\digitalization_payment_dev\public\logo.png"
$resDir = "c:\Users\laych\Documents\digitalization_payment_dev\ibis_rice_field_app\android\app\src\main\res"

# 1. Ensure values/colors.xml exists
$valuesDir = Join-Path $resDir "values"
if (-not (Test-Path $valuesDir)) { New-Item -ItemType Directory -Path $valuesDir -Force }
$colorsXmlPath = Join-Path $valuesDir "colors.xml"
@'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B0F19</color>
</resources>
'@ | Set-Content -Path $colorsXmlPath -Encoding UTF8

# 2. Ensure mipmap-anydpi-v26 exists with XML definitions
$anyDpiDir = Join-Path $resDir "mipmap-anydpi-v26"
if (-not (Test-Path $anyDpiDir)) { New-Item -ItemType Directory -Path $anyDpiDir -Force }

$adaptiveXmlContent = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
'@

Set-Content -Path (Join-Path $anyDpiDir "ic_launcher.xml") -Value $adaptiveXmlContent -Encoding UTF8
Set-Content -Path (Join-Path $anyDpiDir "ic_launcher_round.xml") -Value $adaptiveXmlContent -Encoding UTF8

# 3. Generate PNG icons for legacy & foreground
$sizesLegacy = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$sizesForeground = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

$img = [System.Drawing.Image]::FromFile($srcPath)

# Render Legacy Icons with Dark Background
foreach ($folder in $sizesLegacy.Keys) {
    $targetSize = $sizesLegacy[$folder]
    $destFolder = Join-Path $resDir $folder
    if (-not (Test-Path $destFolder)) { New-Item -ItemType Directory -Path $destFolder -Force }

    $destPath = Join-Path $destFolder "ic_launcher.png"
    $destRoundPath = Join-Path $destFolder "ic_launcher_round.png"
    
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#0B0F19")
    $g.Clear($bgColor)
    
    # Draw logo centered with padding
    $pad = [int]($targetSize * 0.1)
    $drawSize = $targetSize - ($pad * 2)
    $g.DrawImage($img, $pad, $pad, $drawSize, $drawSize)
    $g.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($destRoundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# Render Foreground Icons (Transparent Background for Adaptive Icons)
foreach ($folder in $sizesForeground.Keys) {
    $targetSize = $sizesForeground[$folder]
    $destFolder = Join-Path $resDir $folder

    $destFgPath = Join-Path $destFolder "ic_launcher_foreground.png"
    
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Adaptive Icon safe zone is inner 66%
    $pad = [int]($targetSize * 0.18)
    $drawSize = $targetSize - ($pad * 2)
    $g.DrawImage($img, $pad, $pad, $drawSize, $drawSize)
    $g.Dispose()

    $bmp.Save($destFgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$img.Dispose()
Write-Host "✅ Complete Android Adaptive & Legacy Branding Icons generated successfully!"
