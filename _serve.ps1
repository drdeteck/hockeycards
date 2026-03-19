# Simple static HTTP server for local development
# Usage: powershell -ExecutionPolicy Bypass -File _serve.ps1
# Then open http://localhost:8080 in your browser

param([int]$Port = 8080)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/ (Ctrl+C to stop)"

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.txt'  = 'text/plain'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

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
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
            $response.StatusCode = 404
            $response.ContentType = 'text/plain'
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
