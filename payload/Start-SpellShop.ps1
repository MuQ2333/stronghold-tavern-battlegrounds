$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:SP_SPELL_SHOP = '1'
if (-not $env:HOST) { $env:HOST = '127.0.0.1' }
if (-not $env:PORT) { $env:PORT = '3002' }
node server/index.js
