param(
  [string]$InputPath = (Join-Path $PSScriptRoot "..\\data\\Essay 1 topics+locations.xlsx"),
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\\data\\essay1-topics-map.js")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-Slug {
  param([string]$Value)

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -eq [Globalization.UnicodeCategory]::NonSpacingMark) {
      continue
    }
    [void]$builder.Append($char)
  }

  $slug = [regex]::Replace($builder.ToString().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim("-")
  if (-not $slug) {
    return "item"
  }

  return $slug
}

$coordinateLookup = @{
  "ahmedabad|india"                  = @{ lat = 23.0225; lon = 72.5714; place = "Ahmedabad";          country = "India" }
  "barcelona|spain"                  = @{ lat = 41.3874; lon = 2.1686; place = "Barcelona";          country = "Spain" }
  "beijing|china"                    = @{ lat = 39.9042; lon = 116.4074; place = "Beijing";            country = "China" }
  "berlin|germany"                   = @{ lat = 52.5200; lon = 13.4050; place = "Berlin";             country = "Germany" }
  "boston|united states"             = @{ lat = 42.3601; lon = -71.0589; place = "Boston";             country = "United States" }
  "cairo|egypt"                      = @{ lat = 30.0444; lon = 31.2357; place = "Cairo";              country = "Egypt" }
  "california|united states"         = @{ lat = 36.7783; lon = -119.4179; place = "California";         country = "United States" }
  "chicago|united states"            = @{ lat = 41.8781; lon = -87.6298; place = "Chicago";            country = "United States" }
  "delhi|india"                      = @{ lat = 28.6139; lon = 77.2090; place = "Delhi";              country = "India" }
  "dhaka|bangladesh"                 = @{ lat = 23.8103; lon = 90.4125; place = "Dhaka";              country = "Bangladesh" }
  "hong kong|china"                  = @{ lat = 22.3193; lon = 114.1694; place = "Hong Kong";          country = "China" }
  "kandy|sri lanka"                  = @{ lat = 7.2906; lon = 80.6337; place = "Kandy";              country = "Sri Lanka" }
  "lincoln|united kingdom"           = @{ lat = 53.2307; lon = -0.5406; place = "Lincoln";            country = "United Kingdom" }
  "london|united kingdom"            = @{ lat = 51.5072; lon = -0.1276; place = "London";             country = "United Kingdom" }
  "los angelos|united states"        = @{ lat = 34.0522; lon = -118.2437; place = "Los Angelos";       country = "United States" }
  "manila|philipines"                = @{ lat = 14.5995; lon = 120.9842; place = "Manila";             country = "Philippines" }
  "manila|philippines"               = @{ lat = 14.5995; lon = 120.9842; place = "Manila";             country = "Philippines" }
  "mexico city|mexico"               = @{ lat = 19.4326; lon = -99.1332; place = "Mexico City";        country = "Mexico" }
  "new gourna|egypt"                 = @{ lat = 25.7274; lon = 32.6105; place = "New Gourna";         country = "Egypt" }
  "new haven|united states"          = @{ lat = 41.3083; lon = -72.9279; place = "New Haven";          country = "United States" }
  "new york|united states"           = @{ lat = 40.7128; lon = -74.0060; place = "New York";           country = "United States" }
  "ottawa|canada"                    = @{ lat = 45.4215; lon = -75.6972; place = "Ottawa";             country = "Canada" }
  "pennsylvania|united states"       = @{ lat = 41.2033; lon = -77.1945; place = "Pennsylvania";       country = "United States" }
  "prague|czech republic"            = @{ lat = 50.0755; lon = 14.4378; place = "Prague";             country = "Czech Republic" }
  "santa fe|united states"           = @{ lat = 35.6870; lon = -105.9378; place = "Santa Fe";           country = "United States" }
  "sao paulo|brazil"                 = @{ lat = -23.5558; lon = -46.6396; place = "Sao Paulo";          country = "Brazil" }
  "shanghai|china"                   = @{ lat = 31.2304; lon = 121.4737; place = "Shanghai";           country = "China" }
  "south carolina|united states"     = @{ lat = 33.8361; lon = -81.1637; place = "South Carolina";    country = "United States" }
  "texas|united states"              = @{ lat = 31.9686; lon = -99.9018; place = "Texas";              country = "United States" }
  "tokyo|japan"                      = @{ lat = 35.6764; lon = 139.6500; place = "Tokyo";              country = "Japan" }
  "venice|italy"                     = @{ lat = 45.4408; lon = 12.3155; place = "Venice";             country = "Italy" }
  "vienna|austria"                   = @{ lat = 48.2082; lon = 16.3738; place = "Vienna";             country = "Austria" }
  "virginia|united states"           = @{ lat = 37.4316; lon = -78.6569; place = "Virginia";           country = "United States" }
  "yucatan peninsula|mexico"         = @{ lat = 20.7099; lon = -89.0943; place = "Yucatan Peninsula";  country = "Mexico" }
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$outputDirectory = Split-Path -Parent $OutputPath

if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$zip = [IO.Compression.ZipFile]::OpenRead($resolvedInput)

try {
  $sharedStringsEntry = $zip.GetEntry("xl/sharedStrings.xml")
  $sharedStringsReader = New-Object IO.StreamReader($sharedStringsEntry.Open())
  $sharedStringsXml = [xml]$sharedStringsReader.ReadToEnd()
  $sharedStringsReader.Close()

  $sharedStrings = @()
  foreach ($stringItem in $sharedStringsXml.sst.si) {
    $sharedStrings += [string]$stringItem.InnerText
  }

  $sheetEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")
  $sheetReader = New-Object IO.StreamReader($sheetEntry.Open())
  $sheetXml = [xml]$sheetReader.ReadToEnd()
  $sheetReader.Close()

  $itemsByKey = @{}

  foreach ($row in $sheetXml.worksheet.sheetData.row) {
    $rowNumber = [int]$row.r
    if ($rowNumber -lt 3) {
      continue
    }

    $cells = @{}
    foreach ($cell in $row.c) {
      $column = ([regex]::Match($cell.r, "[A-Z]+")).Value
      $value = ""
      $cellTypeProperty = $cell.PSObject.Properties["t"]
      $cellValueProperty = $cell.PSObject.Properties["v"]
      $cellType = if ($null -ne $cellTypeProperty) { [string]$cellTypeProperty.Value } else { "" }
      if ($cellType -eq "s" -and $null -ne $cellValueProperty) {
        $value = $sharedStrings[[int]$cellValueProperty.Value]
      } elseif ($null -ne $cellValueProperty) {
        $value = [string]$cellValueProperty.Value
      }
      $cells[$column] = $value
    }

    $student = ($cells["A"] | ForEach-Object { $_.Trim() })
    $name = ($cells["B"] | ForEach-Object { $_.Trim() })
    $placeCell = $cells["C"]
    $countryCell = $cells["D"]

    if (-not $name -or -not $placeCell) {
      continue
    }

    $places = @($placeCell -split "`r?`n" | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() })
    $countries = @($countryCell -split "`r?`n" | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() })

    for ($index = 0; $index -lt $places.Count; $index++) {
      $place = $places[$index]
      if ($countries.Count -eq $places.Count) {
        $country = $countries[$index]
      } elseif ($countries.Count -eq 1) {
        $country = $countries[0]
      } elseif ($countries.Count -gt 0) {
        $country = $countries[[Math]::Min($index, $countries.Count - 1)]
      } else {
        $country = ""
      }

      if ($place -eq "Prague") {
        $country = "Czech Republic"
      }

      if ($place -in @("South Carolina", "Virginia")) {
        $country = "United States"
      }

      $lookupKey = "{0}|{1}" -f $place.ToLowerInvariant(), $country.ToLowerInvariant()
      if (-not $coordinateLookup.ContainsKey($lookupKey)) {
        throw "Missing coordinates for '$place, $country' on row $rowNumber."
      }

      $location = $coordinateLookup[$lookupKey]
      $itemKey = "{0}|{1}|{2}" -f $name.ToLowerInvariant(), $location.place.ToLowerInvariant(), $location.country.ToLowerInvariant()

      if (-not $itemsByKey.ContainsKey($itemKey)) {
        $itemsByKey[$itemKey] = @{
          id                      = "{0}-{1}" -f (Get-Slug $name), (Get-Slug $location.place)
          name                    = $name
          place                   = $location.place
          country                 = $location.country
          lat                     = $location.lat
          lon                     = $location.lon
          rows                    = (New-Object System.Collections.Generic.List[int])
          students                = (New-Object System.Collections.Generic.List[string])
        }
      }

      if ($student -and -not $itemsByKey[$itemKey].students.Contains($student)) {
        $itemsByKey[$itemKey].students.Add($student)
      }

      if (-not $itemsByKey[$itemKey].rows.Contains($rowNumber)) {
        $itemsByKey[$itemKey].rows.Add($rowNumber)
      }
    }
  }

  $items = @($itemsByKey.Values | Sort-Object name, country, place)
  $locationCountsByArchitect = @{}

  foreach ($item in $items) {
    if (-not $locationCountsByArchitect.ContainsKey($item.name)) {
      $locationCountsByArchitect[$item.name] = 0
    }
    $locationCountsByArchitect[$item.name]++
  }

  $outputItems = foreach ($item in $items) {
    [pscustomobject]@{
      id                       = $item.id
      name                     = $item.name
      place                    = $item.place
      country                  = $item.country
      lat                      = $item.lat
      lon                      = $item.lon
      students                 = @($item.students)
      rows                     = @($item.rows)
      studentCount             = $item.students.Count
      locationCountForArchitect = $locationCountsByArchitect[$item.name]
    }
  }

  $payload = [pscustomobject]@{
    sourceFile = [IO.Path]::GetFileName($resolvedInput)
    sheetName  = "Essay 1 topics"
    items      = @($outputItems)
  }

  $json = $payload | ConvertTo-Json -Depth 6
  $content = "window.ESSAY_TOPIC_MAP = $json;"
  $utf8NoBom = New-Object Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($OutputPath, $content, $utf8NoBom)
}
finally {
  $zip.Dispose()
}
