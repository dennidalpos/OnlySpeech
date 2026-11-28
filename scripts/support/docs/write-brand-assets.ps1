param(
  [switch]$DryRun
)

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\.."))
$buildBrandRoot = Join-Path $repoRoot "build\brand"
$publicBrandRoot = Join-Path $repoRoot "public\brand"
$docsBrandRoot = Join-Path $repoRoot "docs\product\brand"

$targets = @(
  $buildBrandRoot,
  $publicBrandRoot,
  (Join-Path $publicBrandRoot "social"),
  $docsBrandRoot,
  (Join-Path $docsBrandRoot "social")
)

if ($DryRun) {
  $targets | ForEach-Object { "Would ensure directory: $_" }
  return
}

$targets | ForEach-Object {
  New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

Add-Type -AssemblyName System.Drawing

$palette = @{
  Navy = [System.Drawing.ColorTranslator]::FromHtml("#091018")
  Navy2 = [System.Drawing.ColorTranslator]::FromHtml("#17344a")
  Text = [System.Drawing.ColorTranslator]::FromHtml("#f4f7fb")
  Ink = [System.Drawing.ColorTranslator]::FromHtml("#142022")
  Muted = [System.Drawing.ColorTranslator]::FromHtml("#bfd2de")
  Cyan = [System.Drawing.ColorTranslator]::FromHtml("#55d6ff")
  CyanStrong = [System.Drawing.ColorTranslator]::FromHtml("#1b88cc")
  Warm = [System.Drawing.ColorTranslator]::FromHtml("#ffb54a")
  WarmStrong = [System.Drawing.ColorTranslator]::FromHtml("#ff9151")
  Light = [System.Drawing.ColorTranslator]::FromHtml("#f4efe7")
  LightPanel = [System.Drawing.ColorTranslator]::FromHtml("#fffaf4")
}

function New-OnlySpeechBitmap {
  param([int]$Width, [int]$Height)

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bitmap, $graphics)
}

function New-RoundRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-OnlySpeechMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size,
    [switch]$Light
  )

  $stroke = [Math]::Max(3, $Size * 0.07)
  $corner = $Size * 0.23
  $tile = New-RoundRectPath -X $X -Y $Y -Width $Size -Height $Size -Radius $corner

  if ($Light) {
    $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      [System.Drawing.RectangleF]::new($X, $Y, $Size, $Size),
      $palette.LightPanel,
      [System.Drawing.ColorTranslator]::FromHtml("#d7ddd8"),
      [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $arcPenA = [System.Drawing.Pen]::new($palette.CyanStrong, $stroke)
    $arcPenB = [System.Drawing.Pen]::new($palette.WarmStrong, $stroke)
    $dotBrushA = [System.Drawing.SolidBrush]::new($palette.CyanStrong)
    $dotBrushB = [System.Drawing.SolidBrush]::new($palette.WarmStrong)
  } else {
    $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      [System.Drawing.RectangleF]::new($X, $Y, $Size, $Size),
      $palette.Navy,
      $palette.Navy2,
      [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $arcPenA = [System.Drawing.Pen]::new($palette.Cyan, $stroke)
    $arcPenB = [System.Drawing.Pen]::new($palette.Warm, $stroke)
    $dotBrushA = [System.Drawing.SolidBrush]::new($palette.Cyan)
    $dotBrushB = [System.Drawing.SolidBrush]::new($palette.Warm)
  }

  $arcPenA.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arcPenA.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arcPenB.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arcPenB.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $Graphics.FillPath($bgBrush, $tile)

  $bubbleRadius = $Size * 0.16
  $Graphics.FillEllipse($dotBrushA, $X + $Size * 0.23, $Y + $Size * 0.35, $bubbleRadius, $bubbleRadius)
  $Graphics.FillEllipse($dotBrushB, $X + $Size * 0.61, $Y + $Size * 0.49, $bubbleRadius, $bubbleRadius)

  $pathA = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $pathA.AddBezier(
    $X + $Size * 0.27, $Y + $Size * 0.31,
    $X + $Size * 0.41, $Y + $Size * 0.18,
    $X + $Size * 0.61, $Y + $Size * 0.18,
    $X + $Size * 0.75, $Y + $Size * 0.31
  )
  $Graphics.DrawPath($arcPenA, $pathA)

  $pathB = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $pathB.AddBezier(
    $X + $Size * 0.25, $Y + $Size * 0.70,
    $X + $Size * 0.40, $Y + $Size * 0.82,
    $X + $Size * 0.60, $Y + $Size * 0.82,
    $X + $Size * 0.75, $Y + $Size * 0.69
  )
  $Graphics.DrawPath($arcPenB, $pathB)

  @($tile, $bgBrush, $arcPenA, $arcPenB, $dotBrushA, $dotBrushB, $pathA, $pathB) | ForEach-Object { $_.Dispose() }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Write-IconPng {
  param(
    [string]$Path,
    [int]$Size,
    [switch]$Light
  )

  $items = New-OnlySpeechBitmap -Width $Size -Height $Size
  $bitmap = $items[0]
  $graphics = $items[1]
  $graphics.Clear([System.Drawing.Color]::Transparent)
  Draw-OnlySpeechMark -Graphics $graphics -X 0 -Y 0 -Size $Size -Light:$Light
  Save-Png -Bitmap $bitmap -Path $Path
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Write-LogoPng {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [switch]$Light
  )

  $items = New-OnlySpeechBitmap -Width $Width -Height $Height
  $bitmap = $items[0]
  $graphics = $items[1]
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $markSize = [Math]::Min($Height * 0.76, $Width * 0.22)
  $markX = $Height * 0.12
  $markY = ($Height - $markSize) / 2
  Draw-OnlySpeechMark -Graphics $graphics -X $markX -Y $markY -Size $markSize -Light:$Light

  $textBrush = if ($Light) {
    [System.Drawing.SolidBrush]::new($palette.Ink)
  } else {
    [System.Drawing.SolidBrush]::new($palette.Text)
  }
  $subBrush = if ($Light) {
    [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(190, $palette.Ink))
  } else {
    [System.Drawing.SolidBrush]::new($palette.Muted)
  }

  $font = [System.Drawing.Font]::new("Segoe UI", $Height * 0.27, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subFont = [System.Drawing.Font]::new("Segoe UI", $Height * 0.074, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $textX = $markX + $markSize + $Height * 0.16
  $graphics.DrawString("OnlySpeech", $font, $textBrush, [System.Drawing.PointF]::new($textX, $Height * 0.22))
  $graphics.DrawString("Windows desktop speech translation", $subFont, $subBrush, [System.Drawing.PointF]::new($textX + 2, $Height * 0.62))

  Save-Png -Bitmap $bitmap -Path $Path
  @($textBrush, $subBrush, $font, $subFont, $graphics, $bitmap) | ForEach-Object { $_.Dispose() }
}

function Write-SocialPng {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [string]$Kicker,
    [string]$Title,
    [string]$Body
  )

  $items = New-OnlySpeechBitmap -Width $Width -Height $Height
  $bitmap = $items[0]
  $graphics = $items[1]

  $rect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $palette.Navy, $palette.Navy2, [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
  $graphics.FillRectangle($bg, $rect)
  $cyanGlow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, $palette.Cyan))
  $warmGlow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(38, $palette.Warm))
  $graphics.FillEllipse($cyanGlow, -120, -150, 520, 420)
  $graphics.FillEllipse($warmGlow, $Width - 360, -90, 460, 360)

  Draw-OnlySpeechMark -Graphics $graphics -X 78 -Y 76 -Size 128

  $kickerBrush = [System.Drawing.SolidBrush]::new($palette.Cyan)
  $titleBrush = [System.Drawing.SolidBrush]::new($palette.Text)
  $bodyBrush = [System.Drawing.SolidBrush]::new($palette.Muted)
  $linePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(92, $palette.Warm), 4)
  $graphics.DrawLine($linePen, 82, $Height - 92, $Width - 82, $Height - 92)

  $kickerFont = [System.Drawing.Font]::new("Segoe UI", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $titleFont = [System.Drawing.Font]::new("Segoe UI", 76, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $bodyFont = [System.Drawing.Font]::new("Segoe UI", 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()
  $format.Trimming = [System.Drawing.StringTrimming]::Word

  $graphics.DrawString($Kicker, $kickerFont, $kickerBrush, [System.Drawing.RectangleF]::new(238, 88, $Width - 320, 42), $format)
  $graphics.DrawString($Title, $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(76, 238, $Width - 150, 178), $format)
  $graphics.DrawString($Body, $bodyFont, $bodyBrush, [System.Drawing.RectangleF]::new(82, 430, $Width - 180, 116), $format)

  Save-Png -Bitmap $bitmap -Path $Path
  @($bg, $cyanGlow, $warmGlow, $kickerBrush, $titleBrush, $bodyBrush, $linePen, $kickerFont, $titleFont, $bodyFont, $format, $graphics, $bitmap) | ForEach-Object { $_.Dispose() }
}

function Save-PngBytes {
  param([System.Drawing.Bitmap]$Bitmap)

  $stream = [System.IO.MemoryStream]::new()
  $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $stream.ToArray()
  $stream.Dispose()
  return $bytes
}

function Write-Ico {
  param([string]$Path)

  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $images = foreach ($size in $sizes) {
    $items = New-OnlySpeechBitmap -Width $size -Height $size
    $bitmap = $items[0]
    $graphics = $items[1]
    $graphics.Clear([System.Drawing.Color]::Transparent)
    Draw-OnlySpeechMark -Graphics $graphics -X 0 -Y 0 -Size $size
    $bytes = Save-PngBytes -Bitmap $bitmap
    $graphics.Dispose()
    $bitmap.Dispose()
    [pscustomobject]@{ Size = $size; Bytes = $bytes }
  }

  $stream = [System.IO.File]::Create($Path)
  $writer = [System.IO.BinaryWriter]::new($stream)
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]$images.Count)
  $offset = 6 + (16 * $images.Count)

  foreach ($image in $images) {
    $dimension = if ($image.Size -eq 256) { 0 } else { $image.Size }
    $writer.Write([byte]$dimension)
    $writer.Write([byte]$dimension)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$image.Bytes.Length)
    $writer.Write([UInt32]$offset)
    $offset += $image.Bytes.Length
  }

  foreach ($image in $images) {
    $writer.Write([byte[]]$image.Bytes)
  }

  $writer.Dispose()
  $stream.Dispose()
}

function Write-TextFile {
  param([string]$Path, [string]$Content)
  Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
}

$markSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title desc">
  <title id="title">OnlySpeech mark</title>
  <desc id="desc">Two coordinated speech arcs for a two-person translation workstation.</desc>
  <defs>
    <linearGradient id="tile" x1="32" y1="24" x2="224" y2="232" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#091018"/>
      <stop offset="1" stop-color="#17344a"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="58" fill="url(#tile)"/>
  <circle cx="78" cy="100" r="20" fill="#55d6ff"/>
  <circle cx="174" cy="136" r="20" fill="#ffb54a"/>
  <path d="M70 78 C106 44 154 44 190 78" fill="none" stroke="#55d6ff" stroke-width="18" stroke-linecap="round"/>
  <path d="M66 180 C104 211 153 211 190 178" fill="none" stroke="#ffb54a" stroke-width="18" stroke-linecap="round"/>
</svg>
'@

$markLightSvg = $markSvg.Replace("#091018", "#fffaf4").Replace("#17344a", "#d7ddd8").Replace("#55d6ff", "#1b88cc").Replace("#ffb54a", "#ff9151")

$logoDarkSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 240" role="img" aria-labelledby="title desc">
  <title id="title">OnlySpeech logo</title>
  <desc id="desc">OnlySpeech wordmark with compact translation mark.</desc>
  <rect width="920" height="240" fill="none"/>
  <g transform="translate(30 30) scale(.703125)">
    <rect width="256" height="256" rx="58" fill="#091018"/>
    <circle cx="78" cy="100" r="20" fill="#55d6ff"/>
    <circle cx="174" cy="136" r="20" fill="#ffb54a"/>
    <path d="M70 78 C106 44 154 44 190 78" fill="none" stroke="#55d6ff" stroke-width="18" stroke-linecap="round"/>
    <path d="M66 180 C104 211 153 211 190 178" fill="none" stroke="#ffb54a" stroke-width="18" stroke-linecap="round"/>
  </g>
  <text x="245" y="112" fill="#f4f7fb" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="700">OnlySpeech</text>
  <text x="249" y="159" fill="#bfd2de" font-family="Segoe UI, Arial, sans-serif" font-size="23">Windows desktop speech translation</text>
</svg>
'@

$logoLightSvg = $logoDarkSvg.Replace("#091018", "#fffaf4").Replace("#55d6ff", "#1b88cc").Replace("#ffb54a", "#ff9151").Replace("#f4f7fb", "#142022").Replace("#bfd2de", "#526164")

Write-TextFile -Path (Join-Path $buildBrandRoot "onlyspeech-mark.svg") -Content $markSvg
Write-TextFile -Path (Join-Path $buildBrandRoot "onlyspeech-mark-light.svg") -Content $markLightSvg
Write-TextFile -Path (Join-Path $buildBrandRoot "onlyspeech-logo-dark.svg") -Content $logoDarkSvg
Write-TextFile -Path (Join-Path $buildBrandRoot "onlyspeech-logo-light.svg") -Content $logoLightSvg
Write-TextFile -Path (Join-Path $publicBrandRoot "favicon.svg") -Content $markSvg
Write-TextFile -Path (Join-Path $publicBrandRoot "onlyspeech-mark.svg") -Content $markSvg
Write-TextFile -Path (Join-Path $publicBrandRoot "onlyspeech-logo-dark.svg") -Content $logoDarkSvg

Write-IconPng -Path (Join-Path $repoRoot "build\icon.png") -Size 256
Write-IconPng -Path (Join-Path $buildBrandRoot "onlyspeech-mark-256.png") -Size 256
Write-IconPng -Path (Join-Path $buildBrandRoot "onlyspeech-mark-light-256.png") -Size 256 -Light
Write-IconPng -Path (Join-Path $publicBrandRoot "favicon-32.png") -Size 32
Write-IconPng -Path (Join-Path $publicBrandRoot "apple-touch-icon.png") -Size 180
Write-IconPng -Path (Join-Path $publicBrandRoot "pwa-icon-192.png") -Size 192
Write-IconPng -Path (Join-Path $publicBrandRoot "pwa-icon-512.png") -Size 512
Write-LogoPng -Path (Join-Path $buildBrandRoot "onlyspeech-logo-dark-920x240.png") -Width 920 -Height 240
Write-LogoPng -Path (Join-Path $buildBrandRoot "onlyspeech-logo-light-920x240.png") -Width 920 -Height 240 -Light
Write-Ico -Path (Join-Path $repoRoot "build\icon.ico")

$ogPublic = Join-Path $publicBrandRoot "social\onlyspeech-og.png"
$twitterPublic = Join-Path $publicBrandRoot "social\onlyspeech-twitter-card.png"
$postDocs = Join-Path $docsBrandRoot "social\onlyspeech-announcement.png"
Write-SocialPng -Path $ogPublic -Width 1200 -Height 630 -Kicker "OnlySpeech" -Title "Two-screen speech translation" -Body "Windows desktop workstation for guided in-person conversations."
Write-SocialPng -Path $twitterPublic -Width 1200 -Height 600 -Kicker "OnlySpeech" -Title "Guided live translation on one Windows PC" -Body "Operator and visitor surfaces, setup diagnostics, and packaged delivery."
Write-SocialPng -Path $postDocs -Width 1080 -Height 1080 -Kicker "OnlySpeech" -Title "Windows-first speech translation workstation" -Body "Built for guided two-person conversations on one PC with two displays."

Copy-Item -LiteralPath $ogPublic -Destination (Join-Path $docsBrandRoot "social\onlyspeech-og.png") -Force
Copy-Item -LiteralPath $twitterPublic -Destination (Join-Path $docsBrandRoot "social\onlyspeech-twitter-card.png") -Force

Write-Host "Generated OnlySpeech brand assets."
