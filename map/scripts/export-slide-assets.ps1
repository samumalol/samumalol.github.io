[CmdletBinding()]
param(
    [string]$InputDir = (Get-Location).Path,
    [string]$OutputDir = (Join-Path (Get-Location).Path 'assets\slides'),
    [string]$ManifestPath = (Join-Path (Get-Location).Path 'data\slide-manifest.json'),
    [string]$ArchitectTemplatePath = (Join-Path (Get-Location).Path 'data\architects-template.csv'),
    [int]$PdfDpi = 160,
    [int]$PptWidth = 1600,
    [switch]$SkipPdf,
    [switch]$SkipPptx
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

function Remove-ExistingSlideImages {
    param([string]$DirectoryPath)

    if (-not (Test-Path -LiteralPath $DirectoryPath)) {
        return
    }

    Get-ChildItem -LiteralPath $DirectoryPath -Filter 'slide-*.png' -File -ErrorAction SilentlyContinue |
        Remove-Item -Force
}

function Sort-SlideFiles {
    param([System.IO.FileInfo[]]$Files)

    return $Files | Sort-Object {
        $match = [regex]::Match($_.BaseName, '(\d+)$')
        if ($match.Success) { [int]$match.Groups[1].Value } else { [int]::MaxValue }
    }, Name
}

function Get-RelativePath {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseUri = New-Object System.Uri((Resolve-Path -LiteralPath $BasePath).Path.TrimEnd('\') + '\')
    $targetUri = New-Object System.Uri((Resolve-Path -LiteralPath $TargetPath).Path)
    $relative = $baseUri.MakeRelativeUri($targetUri).ToString()
    return [System.Uri]::UnescapeDataString($relative).Replace('/', '\')
}

function Export-PdfDeck {
    param(
        [System.IO.FileInfo]$SourceFile,
        [string]$DeckOutputDir,
        [string]$ProjectRoot,
        [int]$ResolutionDpi
    )

    $pdftoppm = (Get-Command pdftoppm -ErrorAction Stop).Source
    Remove-ExistingSlideImages -DirectoryPath $DeckOutputDir

    $tempPrefix = Join-Path $DeckOutputDir 'slide'
    $arguments = @(
        '-png',
        '-r', $ResolutionDpi,
        '--',
        $SourceFile.FullName,
        $tempPrefix
    )

    & $pdftoppm @arguments | Out-Null

    $rawSlides = @(Get-ChildItem -LiteralPath $DeckOutputDir -Filter 'slide-*.png' -File)
    if ($rawSlides.Count -eq 0) {
        throw "No slide images were produced for $($SourceFile.Name). Check that pdftoppm is installed and working on this machine."
    }

    $orderedSlides = @(Sort-SlideFiles -Files $rawSlides)

    $relativeSlides = @()
    for ($index = 0; $index -lt $orderedSlides.Count; $index++) {
        $slideNumber = $index + 1
        $targetName = 'slide-{0:D3}.png' -f $slideNumber
        $targetPath = Join-Path $DeckOutputDir $targetName

        if ($orderedSlides[$index].FullName -ne $targetPath) {
            Move-Item -LiteralPath $orderedSlides[$index].FullName -Destination $targetPath -Force
        }

        $relativeSlides += (Get-RelativePath -BasePath $ProjectRoot -TargetPath $targetPath)
    }

    return [pscustomobject]@{
        SlideCount = $relativeSlides.Count
        Slides = $relativeSlides
    }
}

function Open-PowerPoint {
    try {
        return New-Object -ComObject PowerPoint.Application
    }
    catch {
        throw "PowerPoint export failed to initialize. Run this script in a normal desktop session with Microsoft PowerPoint available. $($_.Exception.Message)"
    }
}

function Export-PptDeck {
    param(
        [System.__ComObject]$PowerPoint,
        [System.IO.FileInfo]$SourceFile,
        [string]$DeckOutputDir,
        [string]$ProjectRoot,
        [int]$ImageWidth
    )

    Remove-ExistingSlideImages -DirectoryPath $DeckOutputDir

    $presentation = $null
    try {
        $presentation = $PowerPoint.Presentations.Open($SourceFile.FullName, $true, $false, $false)

        $slideWidth = [double]$presentation.PageSetup.SlideWidth
        $slideHeight = [double]$presentation.PageSetup.SlideHeight
        if ($slideWidth -le 0 -or $slideHeight -le 0) {
            throw 'Presentation reported an invalid slide size.'
        }

        $imageHeight = [int][math]::Round($ImageWidth * ($slideHeight / $slideWidth))
        $relativeSlides = @()

        for ($index = 1; $index -le $presentation.Slides.Count; $index++) {
            $slide = $presentation.Slides.Item($index)
            $targetName = 'slide-{0:D3}.png' -f $index
            $targetPath = Join-Path $DeckOutputDir $targetName
            $slide.Export($targetPath, 'PNG', $ImageWidth, $imageHeight)
            $relativeSlides += (Get-RelativePath -BasePath $ProjectRoot -TargetPath $targetPath)
        }

        return [pscustomobject]@{
            SlideCount = $relativeSlides.Count
            Slides = $relativeSlides
        }
    }
    finally {
        if ($presentation -ne $null) {
            $presentation.Close()
        }
    }
}

$projectRoot = (Get-Location).Path
$resolvedInputDir = (Resolve-Path -LiteralPath $InputDir).Path
$resolvedOutputRoot = [System.IO.Path]::GetFullPath($OutputDir)
$resolvedManifestPath = [System.IO.Path]::GetFullPath($ManifestPath)
$resolvedArchitectTemplatePath = [System.IO.Path]::GetFullPath($ArchitectTemplatePath)

New-Item -ItemType Directory -Path $resolvedOutputRoot -Force | Out-Null
New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($resolvedManifestPath)) -Force | Out-Null
New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($resolvedArchitectTemplatePath)) -Force | Out-Null

$sourceFiles = Get-ChildItem -LiteralPath $resolvedInputDir -File |
    Where-Object { $_.Extension -in @('.pdf', '.pptx') } |
    Sort-Object Name

if (-not $sourceFiles) {
    throw "No .pdf or .pptx files found in $resolvedInputDir"
}

$needsPowerPoint = ($sourceFiles.Extension -contains '.pptx') -and -not $SkipPptx
$powerPoint = $null

if ($needsPowerPoint) {
    Write-Section 'Initializing PowerPoint for PPTX export'
    $powerPoint = Open-PowerPoint
}

$manifestEntries = New-Object System.Collections.Generic.List[object]
$templateRows = New-Object System.Collections.Generic.List[object]
$failedDecks = New-Object System.Collections.Generic.List[object]

try {
    foreach ($file in $sourceFiles) {
        $extension = $file.Extension.ToLowerInvariant()
        if (($extension -eq '.pdf' -and $SkipPdf) -or ($extension -eq '.pptx' -and $SkipPptx)) {
            continue
        }

        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $deckId = Get-Slug -Name $baseName
        $deckOutputDir = Join-Path $resolvedOutputRoot $deckId
        New-Item -ItemType Directory -Path $deckOutputDir -Force | Out-Null

        Write-Section "Exporting $($file.Name)"

        try {
            if ($extension -eq '.pdf') {
                $result = Export-PdfDeck -SourceFile $file -DeckOutputDir $deckOutputDir -ProjectRoot $projectRoot -ResolutionDpi $PdfDpi
            }
            elseif ($extension -eq '.pptx') {
                if ($powerPoint -eq $null) {
                    throw "PowerPoint is required to export $($file.Name)."
                }

                $result = Export-PptDeck -PowerPoint $powerPoint -SourceFile $file -DeckOutputDir $deckOutputDir -ProjectRoot $projectRoot -ImageWidth $PptWidth
            }
            else {
                continue
            }
        }
        catch {
            $failedDecks.Add([pscustomobject]@{
                id = $deckId
                sourceFile = $file.Name
                sourceType = $extension.TrimStart('.')
                error = $_.Exception.Message
            })
            Write-Warning "Failed to export $($file.Name): $($_.Exception.Message)"
            continue
        }

        $manifestEntries.Add([pscustomobject]@{
            id = $deckId
            sourceFile = $file.Name
            sourceType = $extension.TrimStart('.')
            title = $baseName
            slideCount = $result.SlideCount
            outputDir = (Get-RelativePath -BasePath $projectRoot -TargetPath $deckOutputDir)
            slides = $result.Slides
        })

        $templateRows.Add([pscustomobject]@{
            architect_id = $deckId
            source_file = $file.Name
            architect_name = ''
            birth_place = ''
            country = ''
            latitude = ''
            longitude = ''
            birth_year = ''
            death_year = ''
            slide_count = $result.SlideCount
            notes = ''
        })
    }
}
finally {
    if ($powerPoint -ne $null) {
        $powerPoint.Quit()
    }
}

$manifest = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('s')
    inputDir = $resolvedInputDir
    outputDir = $resolvedOutputRoot
    decks = $manifestEntries
    failures = $failedDecks
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resolvedManifestPath -Encoding UTF8
$templateRows | Export-Csv -LiteralPath $resolvedArchitectTemplatePath -NoTypeInformation -Encoding UTF8

Write-Section "Wrote manifest: $resolvedManifestPath"
Write-Section "Wrote architect template: $resolvedArchitectTemplatePath"
Write-Section "Exported $($manifestEntries.Count) deck(s)"

if ($failedDecks.Count -gt 0) {
    Write-Warning "$($failedDecks.Count) deck(s) failed to export."
    exit 1
}
