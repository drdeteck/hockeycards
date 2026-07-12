# Add Mario Lemieux cards from TCDB URLs to dataset
# Usage: .\add-ml66-from-tcdb.ps1 -URLs @("url1", "url2") -TargetDataset "2000-01-to-present"

param(
    [Parameter(Mandatory = $true)]
    [string[]]$URLs,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("2000-01-to-present", "1985-86-to-1999-00", "gems", "stickers", "chase")]
    [string]$TargetDataset = "chase"
)

function Slugify {
    param([string]$text)
    $text = $text.ToLower()
    $text = $text -replace ' - ', '-'
    $text = $text -replace ' ', '-'
    $text = $text -replace "[^a-z0-9\-]", ''
    $text = $text -replace '\-+', '-'
    return $text.Trim('-')
}

function ExtractTCDBData {
    param([string]$url)
    
    # Extract SIDs from URL: sid/{sid}/cid/{cid}
    if ($url -match 'sid/(\d+)/cid/(\d+)') {
        $subsetSid = $matches[1]
        $cardId = $matches[2]
    }
    else {
        Write-Error "Invalid TCDB URL format"
        return $null
    }
    
    return @{
        SubsetSid = $subsetSid
        CardId    = $cardId
        Url       = $url
    }
}

function RenameImages {
    param(
        [string]$SubsetSid,
        [string]$CardId,
        [string]$StandardName
    )
    
    $ml66Path = "k:\Dev\GitHub\HockeyCards\img\cards\ML66"
    $frFile = Join-Path $ml66Path "$SubsetSid-$($CardId)Fr.jpg"
    $bkFile = Join-Path $ml66Path "$SubsetSid-$($CardId)Bk.jpg"
    
    $newFrName = "$StandardName-Mario-LemieuxFr.jpg"
    $newBkName = "$StandardName-Mario-LemieuxBk.jpg"
    
    $renamed = @()
    
    if (Test-Path $frFile) {
        Rename-Item -Path $frFile -NewName $newFrName
        $renamed += @{ Front = $newFrName }
    }
    
    if (Test-Path $bkFile) {
        Rename-Item -Path $bkFile -NewName $newBkName
        $renamed += @{ Back = $newBkName }
    }
    
    return $renamed
}

function GetInsertionIndex {
    param(
        [hashtable]$sets,
        [string]$newSetKey
    )
    
    $keys = $sets.Keys | Sort-Object
    $index = 0
    foreach ($key in $keys) {
        if ([string]::Compare($key, $newSetKey) -gt 0) {
            break
        }
        $index++
    }
    return $index
}

# Main
Write-Output "Processing $($URLs.Count) TCDB card(s)..."

foreach ($url in $URLs) {
    $data = ExtractTCDBData -url $url
    if (-not $data) { continue }
    
    Write-Output "  Extracted: SID=$($data.SubsetSid), CID=$($data.CardId)"
}

Write-Output "Next: Run ml66-image-update skill or use manual JSON insertion following the quick-ref guide."
