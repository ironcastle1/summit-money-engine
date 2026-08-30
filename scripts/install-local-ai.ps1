$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
Write-Host "MERLIN V4 local setup" -ForegroundColor Cyan
Write-Host "This installs only local software. There are no per-message AI charges." -ForegroundColor Green

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable('Path','Machine')
  $user = [Environment]::GetEnvironmentVariable('Path','User')
  $env:Path = "$machine;$user"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js not found. Installing Node.js LTS with winget..."
  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
  Refresh-Path
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is unavailable after Node installation. Restart Windows, then run SETUP_MERLIN.bat again." }

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host "Installing the local AI runtime (Ollama)..."
  winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements
  Refresh-Path
}
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { throw "Ollama was installed but is not yet on PATH. Restart Windows, then run SETUP_MERLIN.bat again." }

Write-Host "Installing MERLIN Node dependencies..."
npm install

if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }

$ramBytes = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$ramGB = [math]::Round($ramBytes / 1GB)
if ($ramGB -le 8) { $model = 'qwen2.5:1.5b' }
elseif ($ramGB -le 16) { $model = 'qwen2.5:3b' }
else { $model = 'qwen2.5:7b' }
Write-Host "Detected approximately $ramGB GB RAM. Selecting base model $model." -ForegroundColor Cyan

$envText = Get-Content '.env' -Raw
if ($envText -match '(?m)^MERLIN_LOCAL_AI_MODEL=') { $envText = [regex]::Replace($envText,'(?m)^MERLIN_LOCAL_AI_MODEL=.*$',"MERLIN_LOCAL_AI_MODEL=merlin-cnc") }
else { $envText += "`r`nMERLIN_LOCAL_AI_MODEL=merlin-cnc`r`n" }
if ($envText -match '(?m)^MERLIN_LOCAL_AI_BASE_MODEL=') { $envText = [regex]::Replace($envText,'(?m)^MERLIN_LOCAL_AI_BASE_MODEL=.*$',"MERLIN_LOCAL_AI_BASE_MODEL=$model") }
else { $envText += "MERLIN_LOCAL_AI_BASE_MODEL=$model`r`n" }
Set-Content '.env' $envText -Encoding UTF8

try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null }
catch {
  Write-Host "Starting local AI runtime..."
  Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
  Start-Sleep -Seconds 4
}

Write-Host "Downloading the local MERLIN base model ($model). This is a one-time model download and may be several GB." -ForegroundColor Yellow
ollama pull $model
$Template = Get-Content 'config\Modelfile.template' -Raw
$Generated = $Template.Replace('{{BASE_MODEL}}',$model)
Set-Content 'config\Modelfile.generated' $Generated -Encoding UTF8
Write-Host "Creating the custom local MERLIN model profile (merlin-cnc)..." -ForegroundColor Cyan
ollama create merlin-cnc -f 'config\Modelfile.generated'

Write-Host "Initialising MERLIN database..."
npm run seed
Write-Host "Running MERLIN checks..."
npm run check
Write-Host ""
Write-Host "SETUP COMPLETE." -ForegroundColor Green
Write-Host "Double-click START_MERLIN.bat whenever you want to use MERLIN." -ForegroundColor Green
Read-Host "Press Enter to close"
