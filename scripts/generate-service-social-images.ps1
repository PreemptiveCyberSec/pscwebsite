$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $root 'assets\images\social\services'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$images = @(
    @{ Slug = 'ai-mcp-security'; Label = 'AI + MCP'; Title = "AI and MCP`nSecurity Assessment"; Accent = '#58F5A0' },
    @{ Slug = 'penetration-testing'; Label = 'OFFENSIVE'; Title = "Penetration`nTesting"; Accent = '#A6F3C5' },
    @{ Slug = 'red-team-exercise'; Label = 'ADVERSARY EMULATION'; Title = "Red Team`nExercise"; Accent = '#FF6B6B' },
    @{ Slug = 'detection-engineering'; Label = 'DEFENSIVE'; Title = "Detection`nEngineering"; Accent = '#67CF91' },
    @{ Slug = 'ransomware-readiness'; Label = 'RESILIENCE'; Title = "Ransomware`nReadiness"; Accent = '#F4C95D' }
)

foreach ($image in $images) {
    $bitmap = New-Object System.Drawing.Bitmap 1200, 630
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $background = [System.Drawing.ColorTranslator]::FromHtml('#030806')
    $accent = [System.Drawing.ColorTranslator]::FromHtml($image.Accent)
    $graphics.Clear($background)

    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(24, $accent)), 1
    for ($x = 0; $x -le 1200; $x += 60) { $graphics.DrawLine($gridPen, $x, 0, $x, 630) }
    for ($y = 0; $y -le 630; $y += 60) { $graphics.DrawLine($gridPen, 0, $y, 1200, $y) }

    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#98A89F'))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#F3F8F5'))
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 6, 15, 10))
    $graphics.FillRectangle($panelBrush, 56, 50, 1088, 530)
    $graphics.FillRectangle($accentBrush, 56, 50, 9, 530)

    $labelFont = New-Object System.Drawing.Font 'Consolas', 20, ([System.Drawing.FontStyle]::Bold)
    $titleFont = New-Object System.Drawing.Font 'Georgia', 62, ([System.Drawing.FontStyle]::Regular)
    $brandFont = New-Object System.Drawing.Font 'Consolas', 18, ([System.Drawing.FontStyle]::Regular)
    $graphics.DrawString($image.Label, $labelFont, $accentBrush, 104, 104)
    $graphics.DrawString($image.Title, $titleFont, $whiteBrush, 98, 170)
    $graphics.DrawString('PREEMPTIVE CYBER SECURITY', $brandFont, $mutedBrush, 102, 520)

    $nodePen = New-Object System.Drawing.Pen $accent, 3
    $graphics.DrawEllipse($nodePen, 905, 140, 150, 150)
    $graphics.DrawEllipse($nodePen, 950, 330, 74, 74)
    $graphics.DrawLine($nodePen, 980, 286, 980, 330)
    $graphics.DrawLine($nodePen, 905, 215, 850, 215)
    $graphics.FillEllipse($accentBrush, 966, 201, 28, 28)

    $path = Join-Path $outputDirectory ($image.Slug + '.png')
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $nodePen.Dispose(); $brandFont.Dispose(); $titleFont.Dispose(); $labelFont.Dispose()
    $panelBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose(); $accentBrush.Dispose(); $gridPen.Dispose()
    $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Generated $($images.Count) service social images in $outputDirectory"
