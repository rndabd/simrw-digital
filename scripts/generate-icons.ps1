Add-Type -AssemblyName System.Drawing

function Create-ResizedImage {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Width,
        [int]$Height,
        [double]$Scale = 1.0
    )
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $targetW = [int]($Width * $Scale)
    $targetH = [int]($Height * $Scale)
    $posX = [int](($Width - $targetW) / 2)
    $posY = [int](($Height - $targetH) / 2)

    $g.DrawImage($src, $posX, $posY, $targetW, $targetH)

    $src.Dispose()
    $g.Dispose()
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$densities = @(
    @{ Folder = "mipmap-mdpi"; Base = 48; Fore = 108 },
    @{ Folder = "mipmap-hdpi"; Base = 72; Fore = 162 },
    @{ Folder = "mipmap-xhdpi"; Base = 96; Fore = 216 },
    @{ Folder = "mipmap-xxhdpi"; Base = 144; Fore = 324 },
    @{ Folder = "mipmap-xxxhdpi"; Base = 192; Fore = 432 }
)

$favicon = (Resolve-Path "public\favicon.png").Path

foreach ($item in $densities) {
    $dir = Join-Path "android\app\src\main\res" $item.Folder
    $baseSize = $item.Base
    $foreSize = $item.Fore

    Create-ResizedImage -SourcePath $favicon -DestPath (Join-Path $dir "ic_launcher.png") -Width $baseSize -Height $baseSize -Scale 0.95
    Create-ResizedImage -SourcePath $favicon -DestPath (Join-Path $dir "ic_launcher_round.png") -Width $baseSize -Height $baseSize -Scale 0.95
    Create-ResizedImage -SourcePath $favicon -DestPath (Join-Path $dir "ic_launcher_foreground.png") -Width $foreSize -Height $foreSize -Scale 0.72
    Write-Output "Generated icons for $($item.Folder)"
}
