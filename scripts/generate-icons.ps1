[CmdletBinding()]
param(
    [string]$SourceImage
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $SourceImage) {
    $SourceImage = Join-Path $repoRoot 'assets\branding\focusflow-icon.png'
}
$imagesDir = Join-Path $repoRoot 'windows\FocusFlow.Package\Images'
$nativeDir = Join-Path $repoRoot 'windows\FocusFlow'

if (-not (Test-Path $SourceImage)) {
    throw "Source image not found: $SourceImage"
}

$rawSource = [System.Drawing.Bitmap]::FromFile($SourceImage)

# The artwork's rounded-tile corners are opaque; clip to a rounded rect so corners become transparent.
$source = New-Object System.Drawing.Bitmap($rawSource.Width, $rawSource.Height)
$maskGraphics = [System.Drawing.Graphics]::FromImage($source)
$maskGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$radius = [int]($rawSource.Width * 0.24)
$diameter = $radius * 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$w = $rawSource.Width; $h = $rawSource.Height
$path.AddArc(0, 0, $diameter, $diameter, 180, 90)
$path.AddArc($w - $diameter, 0, $diameter, $diameter, 270, 90)
$path.AddArc($w - $diameter, $h - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc(0, $h - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()
$brush = New-Object System.Drawing.TextureBrush($rawSource)
$maskGraphics.FillPath($brush, $path)
$brush.Dispose()
$path.Dispose()
$maskGraphics.Dispose()
$rawSource.Dispose()

function New-ResizedBitmap {
    param([System.Drawing.Image]$Image, [int]$Width, [int]$Height)
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $graphics.Dispose()
    return $bitmap
}

function Save-SquareAsset {
    param([string]$Path, [int]$Size)
    $bitmap = New-ResizedBitmap -Image $source -Width $Size -Height $Size
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Host "Wrote $Path (${Size}x${Size})"
}

# Wide/splash tiles: brand background sampled from the tile artwork with the icon centered.
function Save-WideAsset {
    param([string]$Path, [int]$Width, [int]$Height)
    $background = $source.GetPixel(20, [int]($source.Height / 2))
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear($background)
    $iconSize = [int]($Height * 0.72)
    $x = [int](($Width - $iconSize) / 2)
    $y = [int](($Height - $iconSize) / 2)
    $graphics.DrawImage($source, $x, $y, $iconSize, $iconSize)
    $graphics.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Host "Wrote $Path (${Width}x${Height})"
}

# Multi-size ICO container with PNG-compressed entries (supported since Windows Vista).
function Save-Icon {
    param([string]$Path, [int[]]$Sizes)
    $entries = foreach ($size in $Sizes) {
        $bitmap = New-ResizedBitmap -Image $source -Width $size -Height $size
        $stream = New-Object System.IO.MemoryStream
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Dispose()
        [pscustomobject]@{ Size = $size; Data = $stream.ToArray() }
    }

    $fileStream = [System.IO.File]::Create($Path)
    $writer = New-Object System.IO.BinaryWriter($fileStream)
    $writer.Write([uint16]0)                # reserved
    $writer.Write([uint16]1)                # type: icon
    $writer.Write([uint16]$entries.Count)
    $offset = 6 + (16 * $entries.Count)
    foreach ($entry in $entries) {
        $dimension = if ($entry.Size -ge 256) { 0 } else { $entry.Size }
        $writer.Write([byte]$dimension)     # width
        $writer.Write([byte]$dimension)     # height
        $writer.Write([byte]0)              # palette
        $writer.Write([byte]0)              # reserved
        $writer.Write([uint16]1)            # planes
        $writer.Write([uint16]32)           # bit depth
        $writer.Write([uint32]$entry.Data.Length)
        $writer.Write([uint32]$offset)
        $offset += $entry.Data.Length
    }
    foreach ($entry in $entries) {
        $writer.Write($entry.Data)
    }
    $writer.Dispose()
    $fileStream.Dispose()
    Write-Host "Wrote $Path ($($Sizes -join ', '))"
}

Save-SquareAsset -Path (Join-Path $imagesDir 'LockScreenLogo.scale-200.png') -Size 48
Save-SquareAsset -Path (Join-Path $imagesDir 'Square150x150Logo.scale-200.png') -Size 300
Save-SquareAsset -Path (Join-Path $imagesDir 'Square44x44Logo.scale-200.png') -Size 88
Save-SquareAsset -Path (Join-Path $imagesDir 'Square44x44Logo.targetsize-24_altform-unplated.png') -Size 24
Save-SquareAsset -Path (Join-Path $imagesDir 'StoreLogo.png') -Size 50
Save-WideAsset -Path (Join-Path $imagesDir 'Wide310x150Logo.scale-200.png') -Width 620 -Height 300
Save-WideAsset -Path (Join-Path $imagesDir 'SplashScreen.scale-200.png') -Width 1240 -Height 600

Save-Icon -Path (Join-Path $nativeDir 'FocusFlow.ico') -Sizes @(256, 64, 48, 32, 24, 16)
Copy-Item (Join-Path $nativeDir 'FocusFlow.ico') (Join-Path $nativeDir 'small.ico') -Force

$source.Dispose()
Write-Host 'All branding assets generated.'
