# Simple static HTTP server for local development
# Usage: powershell -ExecutionPolicy Bypass -File _serve.ps1
# Then open http://localhost:8080 in your browser

param([int]$Port = 8080)

function New-StaticFileListener {
    param([int]$Port)

    $httpListener = New-Object System.Net.HttpListener
    $httpListener.Prefixes.Add("http://localhost:$Port/")
    return $httpListener
}

function Get-HttpSysProcessId {
    param([int]$Port)

    $serviceState = netsh http show servicestate view=requestq 2>$null
    $currentProcessId = $null
    $foundPort = $false

    foreach ($line in $serviceState) {
        if ($line -match '^\s*ID:\s*(\d+), image:') {
            $currentProcessId = [int]$matches[1]
            continue
        }

        if ($line -match "HTTP://(?:LOCALHOST|\*):$Port/") {
            $foundPort = $true
            if ($currentProcessId) {
                return $currentProcessId
            }
        }
    }

    if ($foundPort) {
        return $currentProcessId
    }

    return $null
}

function Stop-StaleServeProcess {
    param(
        [int]$Port,
        [string]$ScriptPath
    )

    $listeningProcessId = Get-HttpSysProcessId -Port $Port
    if (-not $listeningProcessId -or $listeningProcessId -eq $PID) {
        return $false
    }

    $process = Get-Process -Id $listeningProcessId -ErrorAction SilentlyContinue
    if (-not $process) {
        return $false
    }

    $isServeScript = $process.ProcessName -in @('powershell', 'pwsh')

    if (-not $isServeScript) {
        throw "Port $Port is already in use by PID $listeningProcessId ($($process.ProcessName)). Refusing to kill an unrelated process."
    }

    Stop-Process -Id $listeningProcessId -Force
    Wait-Process -Id $listeningProcessId -Timeout 5 -ErrorAction SilentlyContinue
    Write-Host "Stopped existing _serve.ps1 instance on port $Port (PID $listeningProcessId)."
    return $true
}

function Test-IsExpectedDisconnect {
    param([System.Exception]$Exception)

    if ($Exception -is [System.Net.HttpListenerException]) {
        return $Exception.NativeErrorCode -in @(64, 1229, 995)
    }

    if ($Exception.InnerException) {
        return Test-IsExpectedDisconnect -Exception $Exception.InnerException
    }

    return $false
}

function Invoke-ResponseWrite {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [byte[]]$Bytes
    )

    try {
        $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    }
    catch {
        if (-not (Test-IsExpectedDisconnect -Exception $_.Exception)) {
            throw
        }
    }
}

$root = $PSScriptRoot
$listener = $null

try {
    $listener = New-StaticFileListener -Port $Port
    $listener.Start()
}
catch [System.Net.HttpListenerException] {
    if ($listener) {
        $listener.Close()
    }

    if (-not (Stop-StaleServeProcess -Port $Port -ScriptPath $PSCommandPath)) {
        throw
    }

    $listener = New-StaticFileListener -Port $Port
    $listener.Start()
}

Write-Host "Serving $root on http://localhost:$Port/ (Ctrl+C to stop)"

$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.json'  = 'application/json; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.gif'   = 'image/gif'
    '.svg'   = 'image/svg+xml'
    '.ico'   = 'image/x-icon'
    '.woff'  = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'   = 'font/ttf'
    '.txt'   = 'text/plain'
}

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
        }
        catch [System.Net.HttpListenerException] {
            if ($listener.IsListening) {
                throw
            }

            break
        }

        $request = $context.Request
        $response = $context.Response

        try {
            $rawPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            # Remove leading slash, default to index.html
            $relPath = $rawPath.TrimStart('/')
            if ($relPath -eq '') { $relPath = 'index.html' }
            # Strip query string (already not in AbsolutePath, but just in case)
            $relPath = ($relPath -split '\?')[0]

            $filePath = Join-Path $root $relPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $mime
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode = 200
                $response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
                $response.Headers.Add("Pragma", "no-cache")
                Invoke-ResponseWrite -Response $response -Bytes $bytes
            }
            else {
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
                $response.StatusCode = 404
                $response.ContentType = 'text/plain'
                $response.ContentLength64 = $msg.Length
                Invoke-ResponseWrite -Response $response -Bytes $msg
            }
        }
        finally {
            $response.Close()
        }
    }
}
finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}
