$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
if (-not (Test-Path 'node_modules')) { Write-Host 'MERLIN is not set up yet. Run SETUP_MERLIN.bat first.' -ForegroundColor Yellow; Read-Host 'Press Enter'; exit 1 }
try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null }
catch { Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden; Start-Sleep -Seconds 3 }
$port = 3000
if (Test-Path '.env') {
  $line = Get-Content '.env' | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1
  if ($line) { $port = [int](($line -split '=',2)[1]) }
}
Start-Process "http://localhost:$port"
node server.js
