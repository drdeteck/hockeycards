param(
    [string]$DataPath = (Join-Path $PSScriptRoot '..\data'),
    [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Slugify {
    param(
        [AllowEmptyString()]
        [string]$Text
    )

    if ($null -eq $Text) { return '' }

    $slug = $Text.Trim()
    if ([string]::IsNullOrWhiteSpace($slug)) { return '' }

    $slug = $slug.ToLowerInvariant()
    $slug = $slug -replace '&', 'and'
    $slug = $slug -replace '[^a-z0-9]+', '-'
    $slug = $slug.Trim('-')

    return $slug
}

function Get-MarioLemieuxDataFiles {
    param(
        [string]$BasePath
    )

    if (-not (Test-Path -LiteralPath $BasePath)) {
        throw "Data folder not found: $BasePath"
    }

    return @(Get-ChildItem -Path $BasePath -Filter 'mario-lemieux-data*.json' | Sort-Object Name)
}

function Get-CardRecordsFromSet {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Set,

        [Parameter(Mandatory = $true)]
        [string]$SetKey,

        [Parameter(Mandatory = $true)]
        [string]$SourceFile
    )

    $cards = @()
    $propertyNames = $Set.PSObject.Properties.Name

    if ($propertyNames -contains 'cards') {
        foreach ($card in @($Set.cards)) {
            if ($null -eq $card) { continue }
            $cards += [pscustomobject]@{
                SourceFile = $SourceFile
                SetKey     = $SetKey
                Card       = $card
            }
        }
    }

    if ($propertyNames -contains 'subsets') {
        foreach ($subset in @($Set.subsets)) {
            if ($null -eq $subset) { continue }

            $subsetProperties = $subset.PSObject.Properties.Name
            $subsetKey = $subset.set_key
            if ($subsetProperties -contains 'cards') {
                foreach ($card in @($subset.cards)) {
                    if ($null -eq $card) { continue }
                    $cards += [pscustomobject]@{
                        SourceFile = $SourceFile
                        SetKey     = $subsetKey
                        Card       = $card
                    }
                }
            }
        }
    }

    return $cards
}

function Test-CardIdMatchesBaseNumber {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Id,

        [Parameter(Mandatory = $true)]
        [string]$BaseNumber
    )

    $idSlug = Slugify -Text $Id
    $baseSlug = Slugify -Text $BaseNumber

    if ([string]::IsNullOrWhiteSpace($baseSlug)) {
        return $false
    }

    $pattern = '(?:^|-)' + [regex]::Escape($baseSlug) + '(?:-|$)'
    return ($idSlug -match $pattern)
}

$files = Get-MarioLemieuxDataFiles -BasePath $DataPath
$allCards = @()
$idErrors = [System.Collections.Generic.List[string]]::new()
$idWarnings = [System.Collections.Generic.List[string]]::new()
$seenIds = @{}
$seenBaseNumbersBySet = @{}

foreach ($file in $files) {
    try {
        $root = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    }
    catch {
        $idErrors.Add("Failed to parse JSON: $($file.Name) - $($_.Exception.Message)")
        continue
    }

    if ($null -eq $root) {
        $idErrors.Add("Empty JSON document: $($file.Name)")
        continue
    }

    if ($null -eq $root.sets) {
        $idErrors.Add("Missing 'sets' object: $($file.Name)")
        continue
    }

    foreach ($setEntry in @($root.sets.PSObject.Properties)) {
        $set = $setEntry.Value
        if ($null -eq $set) { continue }

        $cardsInSet = Get-CardRecordsFromSet -Set $set -SetKey $setEntry.Name -SourceFile $file.Name
        foreach ($record in $cardsInSet) {
            $card = $record.Card
            $cardId = $card.id
            $baseNumber = $card.base_number

            $allCards += [pscustomobject]@{
                SourceFile = $record.SourceFile
                SetKey     = $record.SetKey
                Id         = $cardId
                BaseNumber = $baseNumber
            }

            if ([string]::IsNullOrWhiteSpace($cardId)) {
                $idErrors.Add("Missing id in $($file.Name) set '$($record.SetKey)'")
                continue
            }

            if ($cardId -notmatch '^ml') {
                $idErrors.Add("ID does not start with 'ml': $($file.Name) set '$($record.SetKey)' id '$cardId'")
            }

            if ([string]::IsNullOrWhiteSpace($baseNumber)) {
                $idErrors.Add("Missing base_number for id '$cardId' in $($file.Name) set '$($record.SetKey)'")
                continue
            }

            if (-not (Test-CardIdMatchesBaseNumber -Id $cardId -BaseNumber $baseNumber)) {
                $idWarnings.Add("ID/base_number mismatch for $($file.Name) set '$($record.SetKey)' id '$cardId' base_number '$baseNumber'")
            }

            if ($seenIds.ContainsKey($cardId)) {
                $idErrors.Add("Duplicate id '$cardId' found in $($file.Name) and $($seenIds[$cardId])")
            }
            else {
                $seenIds[$cardId] = $file.Name
            }

            $setBaseKey = "$($record.SetKey)|$baseNumber"
            if ($seenBaseNumbersBySet.ContainsKey($setBaseKey)) {
                $idWarnings.Add("Duplicate base_number '$baseNumber' within set '$($record.SetKey)' in $($file.Name)")
            }
            else {
                $seenBaseNumbersBySet[$setBaseKey] = $file.Name
            }
        }
    }
}

if (-not $Quiet) {
    Write-Host "Validated $($allCards.Count) cards across $($files.Count) Mario Lemieux data files." -ForegroundColor Cyan
}

if ($idErrors.Count -gt 0) {
    Write-Host "`nID integrity check failed with $($idErrors.Count) error(s):" -ForegroundColor Red
    foreach ($idError in $idErrors) {
        Write-Host " - $idError" -ForegroundColor Red
    }

    if ($idWarnings.Count -gt 0) {
        Write-Host "`nWarnings ($($idWarnings.Count)):" -ForegroundColor Yellow
        foreach ($idWarning in $idWarnings) {
            Write-Host " - $idWarning" -ForegroundColor Yellow
        }
    }

    exit 1
}

if ($idWarnings.Count -gt 0) {
    Write-Host "`nID integrity check passed with $($idWarnings.Count) warning(s):" -ForegroundColor Yellow
    foreach ($idWarning in $idWarnings) {
        Write-Host " - $idWarning" -ForegroundColor Yellow
    }
    exit 0
}

Write-Host "`nID integrity check passed. No ID mismatches or duplicates found." -ForegroundColor Green
exit 0
