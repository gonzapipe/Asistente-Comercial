Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourcePath = Join-Path $projectRoot 'assets\Venta-Facil-Precios.png'
$iconDirectory = Join-Path $projectRoot 'public\icons'
$androidResources = Join-Path $projectRoot 'android\app\src\main\res'
New-Item -ItemType Directory -Path $iconDirectory -Force | Out-Null

function Save-Icon([System.Drawing.Image]$source, [int]$size, [string]$destination, [single]$scale = 1, [bool]$opaque = $false) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear($(if ($opaque) { [System.Drawing.Color]::FromArgb(65, 114, 204) } else { [System.Drawing.Color]::Transparent }))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $drawSize = [int][Math]::Round($size * $scale)
    $offset = [int][Math]::Round(($size - $drawSize) / 2)
    $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($offset, $offset, $drawSize, $drawSize))
    $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $graphics.Dispose(); $bitmap.Dispose() }
}

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  Save-Icon $source 64 (Join-Path $projectRoot 'public\favicon.png')
  foreach ($size in @(192, 512)) { Save-Icon $source $size (Join-Path $iconDirectory "icon-$size.png") }
  Save-Icon $source 512 (Join-Path $iconDirectory 'icon-maskable-512.png') 0.72 $true
  foreach ($entry in @(
    @{ Density = 'mdpi'; Size = 48; Foreground = 108 },
    @{ Density = 'hdpi'; Size = 72; Foreground = 162 },
    @{ Density = 'xhdpi'; Size = 96; Foreground = 216 },
    @{ Density = 'xxhdpi'; Size = 144; Foreground = 324 },
    @{ Density = 'xxxhdpi'; Size = 192; Foreground = 432 }
  )) {
    $directory = Join-Path $androidResources "mipmap-$($entry.Density)"
    Save-Icon $source $entry.Size (Join-Path $directory 'ic_launcher.png')
    Save-Icon $source $entry.Size (Join-Path $directory 'ic_launcher_round.png')
    Save-Icon $source $entry.Foreground (Join-Path $directory 'ic_launcher_foreground.png') 0.72
  }
} finally { $source.Dispose() }
