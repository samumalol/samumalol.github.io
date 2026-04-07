[CmdletBinding()]
param(
    [string]$InputDir = (Get-Location).Path,
    [string]$OutputPath = (Join-Path (Get-Location).Path 'data\slide-text-extract.json')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Message)
    Write-Host "==> $Message"
}

function Get-Slug {
    param([string]$Name)

    $slug = $Name.ToLowerInvariant()
    $slug = [regex]::Replace($slug, '[^a-z0-9]+', '-')
    $slug = $slug.Trim('-')
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return 'item'
    }

    return $slug
}

function Get-PowerPointShapeText {
    param([object]$Shape)

    $segments = New-Object System.Collections.Generic.List[string]

    try {
        if ($Shape.HasTextFrame -and $Shape.TextFrame.HasText) {
            $text = $Shape.TextFrame.TextRange.Text
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                $segments.Add($text.Trim())
            }
        }
    }
    catch {
    }

    try {
        if ($Shape.HasTable) {
            $rows = $Shape.Table.Rows.Count
            $cols = $Shape.Table.Columns.Count
            for ($r = 1; $r -le $rows; $r++) {
                for ($c = 1; $c -le $cols; $c++) {
                    $cellText = $Shape.Table.Cell($r, $c).Shape.TextFrame.TextRange.Text
                    if (-not [string]::IsNullOrWhiteSpace($cellText)) {
                        $segments.Add($cellText.Trim())
                    }
                }
            }
        }
    }
    catch {
    }

    try {
        if ($Shape.Type -eq 6) {
            foreach ($child in $Shape.GroupItems) {
                foreach ($childText in Get-PowerPointShapeText -Shape $child) {
                    $segments.Add($childText)
                }
            }
        }
    }
    catch {
    }

    return $segments
}

function Extract-PptxText {
    param(
        [object]$PowerPoint,
        [System.IO.FileInfo]$File
    )

    $presentation = $null
    try {
        $presentation = $PowerPoint.Presentations.Open($File.FullName, $true, $false, $false)
        $slideEntries = New-Object System.Collections.Generic.List[object]

        for ($index = 1; $index -le $presentation.Slides.Count; $index++) {
            $slide = $presentation.Slides.Item($index)
            $parts = New-Object System.Collections.Generic.List[string]

            foreach ($shape in $slide.Shapes) {
                foreach ($text in Get-PowerPointShapeText -Shape $shape) {
                    $parts.Add($text)
                }
            }

            $slideEntries.Add([pscustomobject]@{
                slideNumber = $index
                text = (($parts -join "`n").Trim())
            })
        }

        return $slideEntries
    }
    finally {
        if ($presentation -ne $null) {
            $presentation.Close()
        }
    }
}

function Extract-PdfText {
    param(
        [object]$Word,
        [System.IO.FileInfo]$File
    )

    $document = $null
    try {
        $document = $Word.Documents.Open($File.FullName, $false, $true)
        $rawText = $document.Content.Text
        $pages = $rawText -split "\f"
        $entries = New-Object System.Collections.Generic.List[object]

        for ($index = 0; $index -lt $pages.Count; $index++) {
            $entries.Add([pscustomobject]@{
                slideNumber = $index + 1
                text = $pages[$index].Trim()
            })
        }

        return $entries
    }
    finally {
        if ($document -ne $null) {
            $document.Close($false)
        }
    }
}

$resolvedInputDir = (Resolve-Path -LiteralPath $InputDir).Path
$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($resolvedOutputPath)) -Force | Out-Null

$files = Get-ChildItem -LiteralPath $resolvedInputDir -File |
    Where-Object { $_.Extension -in @('.pptx', '.pdf') } |
    Sort-Object Name

if (-not $files) {
    throw "No supported files found in $resolvedInputDir"
}

$powerPoint = $null
$word = $null
$results = New-Object System.Collections.Generic.List[object]

try {
    if ($files.Extension -contains '.pptx') {
        Write-Section 'Initializing PowerPoint'
        $powerPoint = New-Object -ComObject PowerPoint.Application
    }

    if ($files.Extension -contains '.pdf') {
        Write-Section 'Initializing Word'
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $word.DisplayAlerts = 0
    }

    foreach ($file in $files) {
        Write-Section "Extracting text from $($file.Name)"
        $sourceType = $file.Extension.TrimStart('.').ToLowerInvariant()
        $slides = @()

        if ($sourceType -eq 'pptx') {
            $slides = Extract-PptxText -PowerPoint $powerPoint -File $file
        }
        elseif ($sourceType -eq 'pdf') {
            $slides = Extract-PdfText -Word $word -File $file
        }

        $results.Add([pscustomobject]@{
            id = (Get-Slug -Name ([System.IO.Path]::GetFileNameWithoutExtension($file.Name)))
            sourceFile = $file.Name
            sourceType = $sourceType
            slides = $slides
        })
    }
}
finally {
    if ($powerPoint -ne $null) {
        $powerPoint.Quit()
    }

    if ($word -ne $null) {
        $word.Quit()
    }
}

$payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('s')
    items = $results
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resolvedOutputPath -Encoding UTF8
Write-Section "Wrote text extract: $resolvedOutputPath"
