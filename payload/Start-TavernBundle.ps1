$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not $env:HOST) { $env:HOST = '127.0.0.1' }
if (-not $env:PORT) { $env:PORT = '3013' }
node server/index.js
